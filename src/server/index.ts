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

  app.post(
    '/images',
    upload.single('image'),
    (
      req: Request<ParamsDictionary> & {
        file: { path: string; originalname: string };
      },
      res
    ) => {
      const inputPath = req.file.path;
      const { name, ext } = path.parse(req.file.originalname);
      const maxWidth = parseInt(req.body.maxWidth);
      const maxHeight = parseInt(req.body.maxHeight);

      Promise.all([
        resizeImage(req.file.path as string, [maxWidth, maxHeight]),
        getFingerprint(inputPath)
      ])
        .then(([imageBuffer, fingerprint]: [Buffer, string]) => {
          const objectKey = `${name}-${fingerprint}${ext}`;

          return putObject(s3BucketName, objectKey, imageBuffer).then(() => {
            console.log(`Successfully uploaded image: ${objectKey}`);

            res.setHeader('Content-Type', 'application/json');

            res.send(
              JSON.stringify({
                imageUrl: `https://${s3Subdomain}.amazonaws.com/${s3BucketName}/${objectKey}`
              })
            );
          });
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

    console.log(`File changed: ${relativeChangedPath}`);

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
