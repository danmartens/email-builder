import path from 'path';
import fs from 'fs';
import express from 'express';
import WebSocket from 'ws';
import chokidar from 'chokidar';
import Handlebars from 'handlebars';
import stripAnsi from 'strip-ansi';
import { renderEmail } from '../renderEmail';

export const server = () => {
  const app = express();

  app.get('/', (req, res) => {
    const template = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, './views/index.hbs')).toString()
    );

    res.send(
      template({
        emails: fs
          .readdirSync(path.resolve(__dirname, '../emails'))
          .filter((item) =>
            fs
              .statSync(path.join(path.resolve(__dirname, '../emails'), item))
              .isDirectory()
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
    const rootPath = path.resolve(__dirname, `../emails/${name}`);

    const html = fs
      .readFileSync(path.join(rootPath, 'template.hbs'))
      .toString();

    renderEmail({ name, rootPath }, html).then(
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

  const watcher = chokidar.watch(path.resolve(__dirname, '../emails/**/*.hbs'));

  const server = new WebSocket.Server({
    port: 8080
  });

  const connections = new Set<WebSocket>();

  server.on('connection', (connection) => {
    connections.add(connection);
  });

  watcher.on('change', (changedPath) => {
    for (const connection of connections) {
      connection.send(
        JSON.stringify({
          path: changedPath.replace(path.join(__dirname, 'emails'), '')
        })
      );
    }
  });

  app.listen(3000, () => console.log('Now listening on port 3000...'));
};
