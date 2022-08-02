import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import { test, expect, beforeEach } from '@jest/globals';
import nock from 'nock';
import pageLoader from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let distPath;
let fileExpect;
let cssFile;
let jsFile;
let image;
let htmlFile;

beforeEach(async () => {
  distPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  fileExpect = await fsp.readFile(getFixturePath('courses.html'), 'utf-8');
  cssFile = await fsp.readFile(
    getFixturePath('assets/application.css'),
    'utf-8'
  );
  jsFile = await fsp.readFile(getFixturePath('packs/js/runtime.js'), 'utf-8');
  image = await fsp.readFile(
    getFixturePath('assets/professions/nodejs.jpg'),
    'utf-8'
  );
  htmlFile = await fsp.readFile(getFixturePath('register.html'), 'utf-8');
});

test('check loading page', async () => {
  const req = nock('https://ru.hexlet.io')
    .get('/register')
    .reply(200, htmlFile);
  await pageLoader('https://ru.hexlet.io/register', distPath);
  const currDir = await fsp.readdir(distPath);
  const expectFile = await fsp.readFile(path.join(distPath, currDir[0]), 'utf8');
  expect(expectFile).toEqual(htmlFile);
  expect(req.isDone()).toBeTruthy();
});

test('check loading resource', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, fileExpect)
    .get('/assets/application.css')
    .reply(200, cssFile)
    .get('/packs/js/runtime.js')
    .reply(200, jsFile)
    .get('/assets/professions/nodejs.png')
    .reply(200, image)
    .get('/register')
    .reply(200, htmlFile);
  await pageLoader('https://ru.hexlet.io/courses', distPath);
  const currDir = await fsp.readdir(distPath);
  const resourseDir = await fsp.readdir(
    path.join(distPath, 'ru-hexlet-io-courses_files')
  );
  const fileResourceCss = await fsp.readFile(
    path.join(
      distPath,
      'ru-hexlet-io-courses_files',
      'ru-hexlet-io-assets-application.css'
    ),
    'utf-8'
  );
  const fileResourceJs = await fsp.readFile(
    path.join(
      distPath,
      'ru-hexlet-io-courses_files',
      'ru-hexlet-io-packs-js-runtime.js'
    ),
    'utf-8'
  );
  const fileResourceImage = await fsp.readFile(
    path.join(
      distPath,
      'ru-hexlet-io-courses_files',
      'ru-hexlet-io-assets-professions-nodejs.png'
    ),
    'utf-8'
  );
  const fileResourceHtml = await fsp.readFile(
    path.join(
      distPath,
      'ru-hexlet-io-courses_files',
      'ru-hexlet-io-register.html'
    ),
    'utf-8'
  );
  expect(fileResourceCss).toEqual(cssFile);
  expect(fileResourceJs).toEqual(jsFile);
  expect(fileResourceImage).toEqual(image);
  expect(fileResourceHtml).toEqual(htmlFile);
  expect(currDir.length).toBe(2);
  expect(resourseDir.length).toBe(4);
});

test('bad request', async () => {
  const host = 'https://ru.hexlet.io/';
  nock(host).get('/corses').reply(404);
  await expect(pageLoader(`${host}/corses`, distPath)).rejects.toThrow();
});

test('bad responce', async () => {
  const host = 'https://ru.hexlet.io/';
  nock(host)
    .get('/courses')
    .reply(
      200,
      '<html><head><meta name="viewport" content="width=device"></head><body></body><html>'
    );
  await expect(
    pageLoader(`${host}/corses`, path.join(distPath, 'badpath'))
  ).rejects.toThrow();
});
