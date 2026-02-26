import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { styleText } from 'node:util';

import Zip from 'adm-zip';
import bodyParser from 'body-parser';
import chokidar from 'chokidar';
import express, { Request } from 'express';
import basicAuth from 'express-basic-auth';
import { ParamsDictionary } from 'express-serve-static-core';
import glob from 'glob';
import { debounce } from 'lodash-es';
import multer from 'multer';
import stripAnsi from 'strip-ansi';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

import { Configuration } from '../Configuration';
import { renderEmail } from '../posthtml/renderEmail';
import { renderTemplate } from '../renderTemplate';
import { parseSchema } from './utils/parseSchema';
import { resizeAndUploadImages } from './utils/resizeAndUploadImages';

export const server = async (
  mode: 'development' | 'production' = 'production',
) => {
  const configuration = new Configuration();

  const upload = multer({
    dest: path.join(configuration.projectPath, 'tmp/uploads'),
  });

  const app = express();

  let vite: ViteDevServer | null = null;

  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        const fullUrl = url.parse(
          `${req.protocol}://${req.headers.host}${req.originalUrl}`,
        );

        res.redirect(`https://${fullUrl.hostname}${req.originalUrl}`);
      } else {
        next();
      }
    });
  }

  if (configuration.basicAuthPassword != null) {
    app.use(basicAuth({ users: { user: configuration.basicAuthPassword } }));
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  if (mode === 'development') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'server/public')));
  }

  app.get('/', (_req, res) => {
    if (fs.existsSync(configuration.emailsPath)) {
      renderTemplate('index', {
        emails: fs
          .readdirSync(configuration.emailsPath)
          .filter((item) =>
            fs
              .statSync(path.join(configuration.emailsPath, item))
              .isDirectory(),
          )
          .map((item) => {
            return {
              name: item,
            };
          }),
      }).then((html) => {
        res.send(html);
      });
    } else {
      renderTemplate('index', { emails: [] }).then((html) => {
        res.send(html);
      });
    }
  });

  app.get('/emails/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(configuration.emailsPath, name);

    try {
      let schema = '[]';
      const schemaPath = path.join(rootPath, 'schema.json');

      if (fs.existsSync(schemaPath)) {
        schema = fs.readFileSync(schemaPath).toString();
      }

      renderTemplate('show', {
        name,
        schema: JSON.stringify(parseSchema(schema)),
        scriptUrl:
          mode === 'production'
            ? `https://${configuration.host}:${configuration.port}/main.js`
            : '/src/client/index.tsx',
      }).then(async (html) => {
        if (vite != null) {
          html = await vite.transformIndexHtml(req.url, html);
        }
        res.send(html);
      });
    } catch (error) {
      console.error(error);

      renderTemplate('error', {
        message: stripAnsi(error.message),
      }).then((html) => {
        res.status(500);
        res.send(html);
      });
    }
  });

  app.post('/emails/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(configuration.emailsPath, name);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html, {
      publish: false,
      uploadImages: false,
      stripPadding: req.body.stripPadding ?? false,
      stripCustomFonts: req.body.stripCustomFonts ?? false,
      stripMediaQueries: req.body.stripMediaQueries ?? false,
      context: req.body.data,
    }).then(
      (data) => {
        res.send(data);
      },
      (error) => {
        console.error(error);

        renderTemplate('error', {
          message: stripAnsi(error.message),
        }).then((html) => {
          res.status(500);
          res.send(html);
        });
      },
    );
  });

  app.post('/emails/:name/publish', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(configuration.emailsPath, name);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html, {
      publish: true,
      uploadImages: true,
      stripPadding: false,
      stripCustomFonts: false,
      stripMediaQueries: false,
      context: req.body.data,
    }).then(
      (data) => {
        res.send(data);
      },
      (error) => {
        console.error(error);

        renderTemplate('error', {
          message: stripAnsi(error.message),
        }).then((html) => {
          res.status(500);
          res.send(html);
        });
      },
    );
  });

  app.post('/emails/:name/download', async (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(configuration.emailsPath, name);
    const uploadImages = req.body.uploadImages === true;

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    const data = await renderEmail({ name, rootPath }, html, {
      publish: true,
      uploadImages,
      stripPadding: false,
      stripCustomFonts: false,
      stripMediaQueries: false,
      context: req.body.data,
    });

    glob(path.join(rootPath, 'assets/**/*'), (error, files) => {
      if (error != null) {
        console.error(error);

        res.status(500);
        res.end();
      } else {
        const archive = new Zip();

        archive.addFile('index.html', Buffer.from(data, 'utf8'));

        if (!uploadImages) {
          for (const file of files) {
            archive.addLocalFile(file, 'assets');
          }
        }

        res.status(200);
        res.setHeader('content-type', 'application/zip');
        res.setHeader(
          'content-disposition',
          `attachment; filename="${name}.zip"`,
        );
        res.end(archive.toBuffer());
      }
    });
  });

  app.get('/assets/:name/:asset', (req, res) => {
    const file = fs.readFileSync(
      path.join(
        configuration.emailsPath,
        `${req.params.name}/assets/${req.params.asset}`,
      ),
    );

    res.send(file);
  });

  app.post(
    '/images',
    upload.single('image'),
    (
      req: Request<ParamsDictionary, any, any, any, any> & {
        file: { path: string; originalname: string };
      },
      res,
    ) => {
      const maxWidth =
        req.body.maxWidth != null ? parseInt(req.body.maxWidth) : undefined;

      const maxHeight =
        req.body.maxHeight != null ? parseInt(req.body.maxHeight) : undefined;

      resizeAndUploadImages(req.file, [
        { width: maxWidth, height: maxHeight },
        {
          width: maxWidth != null ? maxWidth * 1.5 : undefined,
          height: maxHeight != null ? maxHeight * 1.5 : undefined,
        },
      ])
        .then(([image, retinaImage]) => {
          res.setHeader('Content-Type', 'application/json');

          res.send(
            JSON.stringify({
              src: image.objectUrl,
              srcset: `${retinaImage.objectUrl} 2x, ${image.objectUrl}`,
            }),
          );
        })
        .catch((error) => {
          console.error(error);

          res.setHeader('Content-Type', 'application/json');

          res.send(
            JSON.stringify({
              error: error.message,
            }),
          );
        });
    },
  );

  const server = new WebSocketServer({
    port: 8081,
  });

  const connections = new Set<WebSocket>();

  server.on('connection', (connection) => {
    connections.add(connection);
  });

  const notify = debounce((relativeChangedPath: string) => {
    for (const connection of connections) {
      if (connection.readyState !== WebSocket.OPEN) continue;

      connection.send(
        JSON.stringify({
          path: relativeChangedPath,
        }),
      );
    }
  }, 50);

  const watcher = chokidar.watch('.', {
    ignored(path, stats) {
      if (stats == null) {
        return false;
      }

      if (stats.isDirectory()) {
        return false;
      }

      return !/\.(hbs|json|png|jpe?g|gif)$/.test(path);
    },
    ignoreInitial: true,
    cwd: configuration.emailsPath,
  });

  watcher.on('change', (changedPath) => {
    const relativeChangedPath = changedPath.replace(
      configuration.projectPath,
      '',
    );

    console.log(`File changed: ${relativeChangedPath}`);

    notify(relativeChangedPath);
  });

  watcher.on('add', (changedPath) => {
    const relativeChangedPath = changedPath.replace(
      configuration.projectPath,
      '',
    );

    console.log(`File added: ${relativeChangedPath}`);

    notify(relativeChangedPath);
  });

  app.listen(configuration.port, () => {
    console.log(
      `📧 Server is now listening at ${styleText('cyan', `http://${configuration.host}:${configuration.port}`)}\n`,
    );

    console.log(
      `Emails path: \t${styleText('cyan', configuration.emailsPath)}`,
    );

    if (configuration.s3BucketName != null) {
      console.log(
        `S3 Bucket: \t${styleText('cyan', configuration.s3BucketName)}`,
      );
    }

    if (mode === 'development') {
      console.log('\nWatching for changes...\n');
    }
  });
};
