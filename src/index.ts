#! /usr/bin/env node

require('dotenv').config();

import path from 'path';
import fs from 'fs';
import program from 'commander';
import { server } from './server';
import chalk from 'chalk';
import Configuration from './Configuration';
import logStatus from './logStatus';

program.version(require('../package.json')['version']);

program
  .command('server')
  .alias('s')
  .description('starts production server')
  .action(() => {
    server('production');
  });

program
  .command('develop')
  .alias('d')
  .description('starts development server')
  .action(() => {
    server('development');
  });

program
  .command('new <name>')
  .alias('n')
  .description('creates a new email template')
  .action((name: string) => {
    name = name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/(^-+|-+$)/g, '')
      .toLowerCase();

    const { port } = new Configuration();

    const emailsPath = path.join(process.cwd(), 'emails');
    const emailPath = path.join(emailsPath, name);

    if (!fs.existsSync(emailsPath)) {
      fs.mkdirSync(emailsPath);
    }

    if (fs.existsSync(emailPath)) {
      logStatus(
        'ERROR',
        `An email template with the name "${name}" already exists.\n`
      );
    } else {
      const emailTemplatePath = path.join(emailPath, 'template.hbs');
      const emailSchemaPath = path.join(emailPath, 'schema.json');
      const emailAssetsPath = path.join(emailPath, 'assets');
      const emailPartialsPath = path.join(emailPath, 'partials');

      fs.mkdirSync(emailPath);
      fs.mkdirSync(emailAssetsPath);
      fs.mkdirSync(emailPartialsPath);

      fs.writeFileSync(
        emailTemplatePath,
        '<div padding="80 40" max-width="600">Hello, world!</div>'
      );

      fs.writeFileSync(emailSchemaPath, '[]');

      logStatus('SUCCESS', 'Template created!\n');
    }

    console.log(
      `If the server is running, you can view the template here: ${chalk.cyan(
        `http://localhost:${port}/emails/${name}`
      )}\n`
    );

    console.log(
      `If the server isn't running, you can start it with: ${chalk.cyan(
        `yarn run email-builder develop`
      )}`
    );
  });

program.parse(process.argv);
