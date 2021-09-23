import path from 'path';
import fs from 'fs';
import url from 'url';
import express, { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import basicAuth from 'express-basic-auth';
import bodyParser from 'body-parser';
import multer from 'multer';
import WebSocket from 'ws';
import debounce from 'lodash/debounce';
import chokidar from 'chokidar';
import stripAnsi from 'strip-ansi';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import chalk from 'chalk';
import Zip from 'adm-zip';
import glob from 'glob';
// @ts-ignore
import config from '../../webpack.config';
import { renderEmail } from '../posthtml/renderEmail';
import parseSchema from './utils/parseSchema';
import Configuration from '../Configuration';
import resizeAndUploadImages from './utils/resizeAndUploadImages';
import renderTemplate from '../renderTemplate';

export const server = (mode: 'development' | 'production' = 'production') => {
  const {
    projectPath,
    emailsPath,
    port,
    host,
    assetsPort,
    s3BucketName,
    basicAuthPassword
  } = new Configuration();

  const upload = multer({ dest: path.join(projectPath, 'tmp/uploads') });

  const app = express();

  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        const fullUrl = url.parse(
          `${req.protocol}://${req.headers.host}${req.originalUrl}`
        );

        res.redirect(`https://${fullUrl.hostname}${req.originalUrl}`);
      } else {
        next();
      }
    });
  }

  if (basicAuthPassword != null) {
    app.use(basicAuth({ users: { user: basicAuthPassword } }));
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  if (mode === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
  }

  app.get('/', (_req, res) => {
    if (fs.existsSync(emailsPath)) {
      renderTemplate('index', {
        emails: fs
          .readdirSync(emailsPath)
          .filter((item) =>
            fs.statSync(path.join(emailsPath, item)).isDirectory()
          )
          .map((item) => {
            return {
              name: item
            };
          })
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
    const rootPath = path.resolve(emailsPath, name);

    try {
      let schema = '[]';
      const schemaPath = path.join(rootPath, 'schema.json');

      if (fs.existsSync(schemaPath)) {
        schema = fs.readFileSync(schemaPath).toString();
      }

      renderTemplate('show', {
        name,
        schema: JSON.stringify(parseSchema(schema)),
        scriptUrl: `${mode === 'production' ? 'https' : 'http'}://${host}:${
          mode === 'production' ? port : assetsPort
        }/main.js`
      }).then((html) => {
        res.send(html);
      });
    } catch (error) {
      console.error(error);

      renderTemplate('error', {
        message: stripAnsi(error.message)
      }).then((html) => {
        res.status(500);
        res.send(html);
      });
    }
  });

  app.post('/emails/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(emailsPath, name);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html, {
      publish: false,
      uploadImages: false,
      stripMediaQueries: req.body.stripMediaQueries ?? false,
      context: req.body.data
    }).then(
      (data) => {
        res.send(data);
      },
      (error) => {
        console.error(error);

        renderTemplate('error', {
          message: stripAnsi(error.message)
        }).then((html) => {
          res.status(500);
          res.send(html);
        });
      }
    );
  });

  app.post('/emails/:name/publish', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(emailsPath, name);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html, {
      publish: true,
      uploadImages: true,
      stripMediaQueries: false,
      context: req.body.data
    }).then(
      (data) => {
        res.send(data);
      },
      (error) => {
        console.error(error);

        renderTemplate('error', {
          message: stripAnsi(error.message)
        }).then((html) => {
          res.status(500);
          res.send(html);
        });
      }
    );
  });

  app.post('/emails/:name/download', async (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(emailsPath, name);
    const uploadImages = req.body.uploadImages === true;

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    const data = await renderEmail({ name, rootPath }, html, {
      publish: true,
      uploadImages,
      stripMediaQueries: false,
      context: req.body.data
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
          `attachment; filename="${name}.zip"`
        );
        res.end(archive.toBuffer());
      }
    });
  });

  app.get('/assets/:name/:asset', (req, res) => {
    const file = fs.readFileSync(
      path.join(emailsPath, `${req.params.name}/assets/${req.params.asset}`)
    );

    res.send(file);
  });

  app.post(
    '/images',
    upload.single('image'),
    (
      req: Request<ParamsDictionary> & {
        file: { path: string; originalname: string };
      },
      res
    ) => {
      const maxWidth =
        req.body.maxWidth != null ? parseInt(req.body.maxWidth) : undefined;

      const maxHeight =
        req.body.maxHeight != null ? parseInt(req.body.maxHeight) : undefined;

      resizeAndUploadImages(req.file, [
        { width: maxWidth, height: maxHeight },
        {
          width: maxWidth != null ? maxWidth * 1.5 : undefined,
          height: maxHeight != null ? maxHeight * 1.5 : undefined
        }
      ])
        .then(([image, retinaImage]) => {
          res.setHeader('Content-Type', 'application/json');

          res.send(
            JSON.stringify({
              src: image.objectUrl,
              srcset: `${retinaImage.objectUrl} 2x, ${image.objectUrl}`
            })
          );
        })
        .catch((error) => {
          console.error(error);

          res.setHeader('Content-Type', 'application/json');

          res.send(
            JSON.stringify({
              error: error.message
            })
          );
        });
    }
  );

  const watcher = chokidar.watch(
    path.resolve(projectPath, '**/*.{hbs,json,png,jpg,jpeg,gif}'),
    {
      ignored: path.resolve(projectPath, 'node_modules'),
      ignoreInitial: true
    }
  );

  const server = new WebSocket.Server({
    port: 8081
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
          path: relativeChangedPath
        })
      );
    }
  }, 50);

  watcher.on('change', (changedPath) => {
    const relativeChangedPath = changedPath.replace(projectPath, '');

    console.log(`File changed: ${relativeChangedPath}`);

    notify(relativeChangedPath);
  });

  watcher.on('add', (changedPath) => {
    const relativeChangedPath = changedPath.replace(projectPath, '');

    console.log(`File added: ${relativeChangedPath}`);

    notify(relativeChangedPath);
  });

  app.listen(port, () => {
    console.log(
      `📧 Server is now listening at ${chalk.cyan(`http://${host}:${port}`)}\n`
    );

    console.log(`Emails path: \t${chalk.cyan(emailsPath)}`);

    if (s3BucketName != null) {
      console.log(`S3 Bucket: \t${chalk.cyan(s3BucketName)}`);
    }

    if (mode === 'development') {
      const options = {
        host,
        port: assetsPort,
        noInfo: true,
        overlay: true
      };

      WebpackDevServer.addDevServerEntrypoints(config, options);

      const compiler = webpack(config);
      const server = new WebpackDevServer(compiler, options);

      server.listen(assetsPort, host, (error) => {
        if (error) {
          return console.log(error);
        }

        console.log('\nWatching for changes...\n');

        // ['SIGINT', 'SIGTERM'].forEach(signal => {
        //   process.on(signal, () => {
        //     server.close();
        //     process.exit();
        //   });
        // });
      });
    }
  });
};
