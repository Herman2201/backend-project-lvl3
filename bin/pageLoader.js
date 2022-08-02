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
    'output dir',
    `${currentDir}`,
  )
  .action((link, path) => {
    pageLoader(link, path.output)
      .then((namePage) => console.log(`Page was downloaded as '${namePage}'`))
      .catch((error) => {
        console.error(`${error.code}: ${error.message}`);
        process.exit(1);
      });
  })
  .parse(process.argv);
