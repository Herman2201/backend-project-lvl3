#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

const currentDir = process.cwd();

program
  .version('1.0.0')
  .description('Compares two configuration files and shows a difference.')
  .argument('<url>')
  .option(
    '-o, --output [dir]',
    'output dir (default: "/home/user/current-dir")',
    `${currentDir}`,
  )
  .action((link, path) => {
    pageLoader(path, link).then(() => console.log('correct'));
  })
  .parse(process.argv);
