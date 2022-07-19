import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';
import { test, expect } from '@jest/globals';
import nock from 'nock';
import pageLoader from 'index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let dir;

beforeEach(async () => {
  dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('load page', () => {
  // pageLoader('')
});
