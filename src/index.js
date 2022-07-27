import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';
import debug from 'debug';
import Listr from 'listr';
import keys from 'lodash.keys';

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
  if (pathname === '/') {
    return host.replace(reg, '-');
  }
  const { dir, name, ext } = path.parse(host + pathname);
  return `${dir}/${name}`.replace(reg, '-') + ext;
};

const loadResours = (dirpath, link, name) => axios
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

const getResourcePage = (address, dom, dirpath) => {
  const promises = keys(tags).reduce(
    (acc, tag) => [
      ...acc,
      ...dom(tag)
        .map((index, element) => {
          const valueAttr = dom(element).attr(tags[tag]);
          const linkAttr = new URL(valueAttr, address.origin);
          if (address.host !== linkAttr.host) {
            return {};
          }
          const namePage = getNamePage(linkAttr);
          const ext = path.parse(namePage).ext ? '' : '.html';
          dom(element).attr(tags[tag], path.join(dirpath, `${namePage}${ext}`));
          return {
            title: `${linkAttr.href}`,
            task: () => loadResours(dirpath, linkAttr.href, `${namePage}${ext}`),
          };
        })
        .get(),
    ],
    [],
  );
  return promises;
};

const heandlerPage = (html, url, output) => {
  const $ = cheerio.load(html);
  const name = getNamePage(url);
  const dirName = `${name}_file`;
  const fileName = `${name}.html`;
  const dirpath = path.join(output, dirName);
  return fsp
    .mkdir(dirpath)
    .then(() => getResourcePage(url, $, dirpath))
    .then((promises) => {
      const list = new Listr(promises, {
        concurrent: true,
        exitOnError: false,
      });
      return list.run();
    })
    .then(() => fsp.writeFile(
      path.join(output, fileName),
      beautify($.html(), options).trim(),
    ))
    .then(() => fileName);
};

const pageLoader = ({ output }, link) => {
  const url = new URL(link);
  return axios.get(link).then(({ data }) => heandlerPage(data, url, output));
};

export default pageLoader;
