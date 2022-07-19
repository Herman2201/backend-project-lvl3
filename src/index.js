import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';

const options = {
  parser: 'html',
  tabWidth: 2,
};
const { format: beautify } = prettier;

const getNamePage = (address) => {
  const url = new URL(address);
  const reg = new RegExp(/[^a-zA-z0-9]/gi);
  return `${url.host}${url.pathname}`.replace(reg, '-');
};

const loadResurs = (html, url, dirPath) => {
  const $ = cheerio.load(html);
  const dirName = `${getNamePage(url)}_file`;
  const newDirPath = path.join(dirPath, dirName);
  const assets = $('img').attr('src');
  const parseUrl = path.parse(assets);
  const newPathAssetc =
    newDirPath +
    '/' +
    getNamePage('http:' + parseUrl.dir + '/' + parseUrl.name) +
    parseUrl.ext;
  $('img').attr().src = newPathAssetc;
  return fsp
    .mkdir(newDirPath)
    .then(() => {
      const url1 = new URL(assets, url);
      return axios.get(url1.href, {
        method: 'get',
        responseType: 'stream',
      });
    })
    .then(({ data }) => fsp.writeFile(newPathAssetc, data))
    .then(() =>
      fsp.writeFile(
        path.join(dirPath, `${getNamePage(url)}.html`),
        beautify($.html(), options)
      )
    )
    .catch(console.error);
};

const pageLoader = ({ output }, link) => {
  const name = getNamePage(link);
  const file = `${getNamePage(link)}.html`;
  return (
    axios
      .get(link)
      .then(({ data }) => loadResurs(data, link, output))
      // fsp.writeFile(path.join(output, file), response.data))
      // .then(() => fsp.readFile(file, 'utf8'))
      // .then((data) => {
      //   const $ = cheerio.load(data);
      //   const assets = $('img').attr('src');
      //   const parseUrl = path.parse(assets);
      //   axios({
      //     url: assets,
      //     method: 'get',
      //     responseType: 'stream',
      //   })
      //     .then(({ data }) => fsp.writeFile(
      //       path.join(
      //         dir,
      //         `${name
      //         }-${
      //           cleanName(`${parseUrl.dir}/${parseUrl.name}`)
      //         }${parseUrl.ext}`,
      //       ),
      //       data,
      //     ))
      //     .catch(console.error);
      // })
      .catch((e) => {
        throw e;
      })
  );
};

export default pageLoader;
