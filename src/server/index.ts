import path from 'path';
import fs from 'fs';
import express, { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import bodyParser from 'body-parser';
import multer from 'multer';
import WebSocket from 'ws';
import chokidar from 'chokidar';
import Handlebars from 'handlebars';
import stripAnsi from 'strip-ansi';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import chalk from 'chalk';
import config from '../../webpack.config';
import { renderEmail } from '../posthtml/renderEmail';
import resizeImage from './utils/resizeImage';
import getFingerprint from './utils/getFingerprint';
import putObject from './utils/putObject';
import parseSchema from './utils/parseSchema';
import Configuration from '../Configuration';
import { Dimensions } from './types';

export const server = () => {
  const {
    projectPath,
    emailsPath,
    port,
    host,
    assetsPort,
    s3BucketName,
    awsRegion
  } = new Configuration();

  const s3Subdomain =
    awsRegion == null || awsRegion === 'us-east-1' ? 's3' : `s3-${awsRegion}`;

  const upload = multer({ dest: path.join(projectPath, 'tmp/uploads') });

  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req, res) => {
    const template = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, './views/index.hbs')).toString()
    );

    res.send(
      template({
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
      })
    );
  });

  app.get('/emails/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(emailsPath, name);

    try {
      const schema = fs
        .readFileSync(path.join(rootPath, 'schema.json'))
        .toString();

      const template = Handlebars.compile(
        fs.readFileSync(path.resolve(__dirname, './views/show.hbs')).toString()
      );

      res.send(
        template({
          name,
          schema: JSON.stringify(parseSchema(schema))
        })
      );
    } catch (error) {
      console.error(error);

      // TODO: Better error handling
      res.send('ERR');
    }
  });

  app.post('/emails/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9\-_]/gi, '');
    const rootPath = path.resolve(emailsPath, name);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html, req.body.data).then(
      (data) => {
        res.send(data);
      },
      (error) => {
        console.error(error);

        const errorTemplate = Handlebars.compile(
          fs.readFileSync(path.resolve(__dirname, '../error.hbs')).toString()
        );

        res.send(errorTemplate({ message: stripAnsi(error.message) }));
      }
    );
  });

  app.get('/assets/:name/:asset', (req, res) => {
    const file = fs.readFileSync(
      path.resolve(
        __dirname,
        `../emails/${req.params.name}/assets/${req.params.asset}`
      )
    );

    res.send(file);
  });

  const dimensionsString = (dimensions: Dimensions): string => {
    const [width, height] = dimensions;

    if (width != null && height != null) {
      return `${width}w${height}h`;
    }

    if (width != null) {
      return `${width}w`;
    }

    if (height != null) {
      return `${height}h`;
    }
  };

  const resizeAndUploadImages = async (
    imageFile: { originalname: string; path: string },
    dimensions: Dimensions
  ) => {
    const { name, ext } = path.parse(imageFile.originalname);

    const retinaDimensions: Dimensions = [
      dimensions[0] != null ? dimensions[0] * 1.5 : undefined,
      dimensions[1] != null ? dimensions[1] * 1.5 : undefined
    ];

    const [imageBuffer, retinaImageBuffer, fingerprint] = await Promise.all([
      resizeImage(imageFile.path, dimensions),
      resizeImage(imageFile.path, retinaDimensions),
      getFingerprint(imageFile.path)
    ]);

    const imageKey = `${name}-${dimensionsString(
      dimensions
    )}-${fingerprint}${ext}`;

    const retinaImageKey = `${name}-${dimensionsString(
      retinaDimensions
    )}-${fingerprint}${ext}`;

    await Promise.all([
      putObject(s3BucketName, imageKey, imageBuffer as Buffer),
      putObject(s3BucketName, retinaImageKey, retinaImageBuffer as Buffer)
    ]);

    return [imageKey, retinaImageKey];
  };

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

      resizeAndUploadImages(req.file, [maxWidth, maxHeight])
        .then(([imageKey, retinaImageKey]) => {
          console.log(
            `Uploaded images:\n  - ${imageKey}\n  - ${retinaImageKey}\n`
          );

          res.setHeader('Content-Type', 'application/json');

          res.send(
            JSON.stringify({
              imageUrl: `https://${s3Subdomain}.amazonaws.com/${s3BucketName}/${imageKey}`,
              retinaImageUrl: `https://${s3Subdomain}.amazonaws.com/${s3BucketName}/${retinaImageKey}`
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

  console.log('SETUP');

  const watcher = chokidar.watch(
    path.resolve(emailsPath, '**/*.{hbs,json,png,jpg,jpeg,gif}')
  );

  const server = new WebSocket.Server({
    port: 8081
  });

  const connections = new Set<WebSocket>();

  server.on('connection', (connection) => {
    connections.add(connection);
  });

  watcher.on('change', (changedPath) => {
    const relativeChangedPath = changedPath.replace(emailsPath, '');

    console.log(`File changed: ${relativeChangedPath}\n`);

    for (const connection of connections) {
      if (connection.readyState !== WebSocket.OPEN) continue;

      connection.send(
        JSON.stringify({
          path: relativeChangedPath
        })
      );
    }
  });

  app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
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

        console.log(
          `📧 Server is now listening at ${chalk.cyan(
            `http://${host}:${port}`
          )}\n`
        );

        console.log(`Emails path: \t${chalk.cyan(emailsPath)}`);

        if (s3BucketName != null) {
          console.log(`S3 Bucket: \t${chalk.cyan(s3BucketName)}`);
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
