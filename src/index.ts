import path from 'path';
import fs from 'fs';
import express from 'express';
import WebSocket from 'ws';
import { renderEmail } from './renderEmail';

const app = express();

app.get('/', (req, res) => {
  const html = fs
    .readFileSync(path.join(__dirname, 'emails/template.hbs'))
    .toString();

  renderEmail(html).then((data) => {
    res.send(`
      <html>
        <head>
          <script>
            const socket = new WebSocket('ws://localhost:8080');

            socket.addEventListener('message', () => {
              location.reload();
            });
          </script>
        </head>

        <body>${data}</body>
      </html>
    `);
  });
});

import chokidar from 'chokidar';

const watcher = chokidar.watch(path.join(__dirname, 'emails/*.hbs'));

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
