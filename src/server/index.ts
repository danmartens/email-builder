import path from 'path';
import fs from 'fs';
import express from 'express';
import WebSocket from 'ws';
import chokidar from 'chokidar';
import Handlebars from 'handlebars';
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
          .map((item) => {
            return {
              name: item
            };
          })
      })
    );
  });

  app.get('/:name', (req, res) => {
    const html = fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../emails/${req.params.name.replace(
            /[^a-z0-9\-_]/gi,
            ''
          )}/template.hbs`
        )
      )
      .toString();

    renderEmail(html).then((data) => {
      res.send(data);
    });
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
