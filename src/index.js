import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';
import debug from 'debug';
import Listr from 'listr';
import keys from 'lodash.keys';
import { cwd } from 'process';

const options = {
  parser: 'html',
  tabWidth: 2,
};
const { format: beautify } = prettier;

const debugLog = debug('loade-page');

const tags = {
  script: 'src',
  img: 'src',
  link: 'href',
};

const getNamePage = ({ host, pathname }) => {
  const reg = /[^a-zA-z0-9]/gi;
  const { dir, name, ext } = path.parse(host + pathname);
  const result = `${dir}/${name}`
    .split(reg)
    .filter((item) => item !== '')
    .join('-');
  return `${result}${ext}`;
};

const loadResource = (dirpath, link, name) => axios
  .get(link, {
    responseType: 'stream',
  })
  .then(({ data }) => {
    debugLog(`Resource url: ${link} was loaded`);
    return fsp.writeFile(path.join(dirpath, name), data, 'utf-8');
  })
  .then(() => {
    debugLog(`Resource ${dirpath} is write to disk`);
  });

const getLoadTasks = (address, dom, dirpath, dirName) => {
  const promises = keys(tags).reduce((acc, tag) => {
    const resource = dom(tag)
      .map((_, element) => {
        const valueAttr = dom(element).attr(tags[tag]);
        const linkAttr = new URL(valueAttr, address.origin);
        if (valueAttr && address.host === linkAttr.host) {
          const namePage = getNamePage(linkAttr);
          const ext = path.parse(namePage).ext ? '' : '.html';
          dom(element).attr(tags[tag], path.join(dirName, `${namePage}${ext}`));
          return {
            title: linkAttr.href,
            task: () => loadResource(dirpath, linkAttr.href, `${namePage}${ext}`),
          };
        }
        return [];
      })
      .get();
    return [...acc, ...resource];
  }, []);
  return promises;
};

const heandlerPage = (html, url, output) => {
  const $ = cheerio.load(html);
  const name = getNamePage(url);
  const dirName = `${name}_files`;
  const fileName = `${name}.html`;
  const dirpath = path.join(output, dirName);
  return fsp
    .mkdir(dirpath)
    .then(() => {
      const promises = getLoadTasks(url, $, dirpath, dirName);
      return new Listr(promises, {
        concurrent: true,
        exitOnError: false,
      })
        .run()
        .catch((error) => ({ result: 'error', error }));
    })
    .then(() => fsp.writeFile(
      path.join(output, fileName),
      beautify($.html(), options).trim()
    ));
};

const pageLoader = (link, output = cwd()) => {
  const url = new URL(link);
  return axios.get(link).then(({ data }) => heandlerPage(data, url, output));
};

export default pageLoader;
