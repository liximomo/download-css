import path from 'path';
import http from 'http';
import https from 'https';
import fs from 'fs';
import fetch from 'node-fetch';
import css from 'css';
import fse from 'fs-extra';
import { urlToPath } from './utils';

const URL_REGEX = /url\((.*?)\)/i;

const defaultExtensions = [
  '.jpeg',
  '.png',
  '.jpg',
  '.gif',
  '.bmp',
  '.webp',
];

const defaultOption = {
  avalialeExtensions: [],
  assetsFolder: 'assets',
  output: '',
  rewriteUrl: undefined,
  name: undefined,
};

function downloadUrl(url, out) {
  return new Promise(async (resolve, reject) => {
    const pathInfo = urlToPath(url);
    const filename = path.join(out, pathInfo.name);
    const dir = path.dirname(filename);
    await fse.ensureDir(dir);
    const file = fs.createWriteStream(filename);
    const request = url.indexOf('https') === 0 ? https : http;
    request.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(); // close() is async, call cb after close completes.
        console.log(`${url} downlod finish`);
        resolve(filename);
      });
      file.on('error', reject);
    });
  });
}

export default async function downloadMedias(urlStr, opt) {
  const option = Object.assign({}, defaultOption, opt);
  const rewriteUrl = option.rewriteUrl !== undefined ? option.rewriteUrl : `./${option.assetsFolder}`;
  const avalialeExtensions = defaultExtensions.concat(option.avalialeExtensions);

  const cssPath = urlToPath(urlStr);
  const assetBasePath = cssPath.basePath;

  const cssFileName = opt.name !== undefined ? opt.name : cssPath.name;

  const resp = await fetch(urlStr);
  const cssContent = await resp.text();
  const ast = css.parse(cssContent);
  const { stylesheet } = ast;
  const { rules } = stylesheet;

  const assetUrls = rules.reduce((urls, rule) => {
    const { declarations } = rule;
    if (declarations === undefined) {
      return urls;
    }

    declarations.forEach((declaration) => {
      const value = declaration.value.trim().toLowerCase();
      if (value.indexOf('url') === -1) {
        return;
      }

      const matchs = value.match(URL_REGEX);
      if (!matchs) {
        return;
      }

      const targetUrl = matchs[1].trim().toLowerCase();
      if (targetUrl.startsWith('data:')) {
        return;
      }

      const assetPath = urlToPath(targetUrl);
      if (avalialeExtensions.indexOf(assetPath.ext) === -1) {
        return;
      }

      let fullpath = path.join(assetPath.basePath, assetPath.name);
      if (!path.isAbsolute(fullpath)) {
        fullpath = path.resolve(assetBasePath, fullpath);
      }

      const finalUrl = `${cssPath.prefix}${fullpath}`;
      urls.push(finalUrl);

      // url rewrite
      // eslint-disable-next-line no-param-reassign
      declaration.value = `url(${path.join(rewriteUrl, assetPath.name)})`;
    });
    return urls;
  }, []);

  const writeCss = fse.outputFile(path.join(option.output, cssFileName), css.stringify(ast));
  const downloadTasks = assetUrls.map(url =>
    downloadUrl(url, path.join(option.output, option.assetsFolder)));
  await Promise.all([...downloadTasks, writeCss]);
}
