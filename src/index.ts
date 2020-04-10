#! /usr/bin/env node

require('dotenv').config();

import program from 'commander';
import { server } from './server';

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

program.parse(process.argv);
