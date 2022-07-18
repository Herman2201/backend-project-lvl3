import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const cleanName = (name) => {
  const url = new URL(name);
  const newUrl = `${url.host}${url.pathname}`;
  const reg = new RegExp(/[^a-zA-z0-9]/gi);
  return newUrl.replace(reg, '-');
};

const pageLoader = ({ output }, link) => {
  const name = cleanName(link);
  const file = cleanName(link) + '.html';
  const dir = cleanName(link) + '_file';
  return (
    axios
      .get(link)
      .then((response) => fsp.writeFile(path.join(output, file), response.data))
      .then(() => fsp.mkdir(dir))
      .then(() => fsp.readFile(file, 'utf8'))
      .then((data) => {
        const $ = cheerio.load(data);
        const assets = $('img').attr('src');
        const parseUrl = path.parse(assets);
        axios({
          url: assets,
          method: 'get',
          responseType: 'stream',
        })
          .then(({ data }) =>
            fsp.writeFile(
              path.join(
                dir,
                name +
                  '-' +
                  cleanName(`${parseUrl.dir}/${parseUrl.name}`) +
                  parseUrl.ext
              ),
              data
            )
          )
          .catch(console.error);
      })
      .catch((e) => {
        throw e;
      })
  );
};

export default pageLoader;
