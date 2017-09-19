'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var http = _interopDefault(require('http'));
var https = _interopDefault(require('https'));
var fs = _interopDefault(require('fs'));
var fetch = _interopDefault(require('node-fetch'));
var css = _interopDefault(require('css'));
var fse = _interopDefault(require('fs-extra'));
var url = _interopDefault(require('url'));

function urlToPath(urlStr) {
  const parsedUrl = url.parse(urlStr);
  const port = parsedUrl.port ? `:${parsedUrl.port}` : '';
  const prefix = `${parsedUrl.protocol}//${parsedUrl.host}${port}`;
  const basePath = path.dirname(parsedUrl.pathname);
  const name = path.basename(parsedUrl.pathname);
  const ext = path.extname(parsedUrl.pathname);
  return {
    prefix,
    basePath,
    name,
    ext
  };
}

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const URL_REGEX = /url\((.*?)\)/i;

const defaultExtensions = ['.jpeg', '.png', '.jpg', '.gif', '.bmp', '.webp'];

const defaultOption = {
  avalialeExtensions: [],
  assetsFolder: 'assets',
  output: '',
  rewriteUrl: undefined,
  name: undefined
};

function downloadUrl(url$$1, out) {
  return new Promise((() => {
    var _ref = _asyncToGenerator(function* (resolve, reject) {
      const pathInfo = urlToPath(url$$1);
      const filename = path.join(out, pathInfo.name);
      const dir = path.dirname(filename);
      yield fse.ensureDir(dir);
      const file = fs.createWriteStream(filename);
      const request = url$$1.indexOf('https') === 0 ? https : http;
      request.get(url$$1, function (response) {
        response.pipe(file);
        file.on('finish', function () {
          file.close(); // close() is async, call cb after close completes.
          console.log(`${url$$1} downlod finish`);
          resolve(filename);
        });
        file.on('error', reject);
      });
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })());
}

var main = (() => {
  var _ref2 = _asyncToGenerator(function* (urlStr, opt) {
    const option = Object.assign({}, defaultOption, opt);
    const rewriteUrl = option.rewriteUrl !== undefined ? option.rewriteUrl : `./${option.assetsFolder}`;
    const avalialeExtensions = defaultExtensions.concat(option.avalialeExtensions);

    const cssPath = urlToPath(urlStr);
    const assetBasePath = cssPath.basePath;

    const cssFileName = opt.name !== undefined ? opt.name : cssPath.name;

    const resp = yield fetch(urlStr);
    const cssContent = yield resp.text();
    const ast = css.parse(cssContent);
    const { stylesheet } = ast;
    const { rules } = stylesheet;

    const assetUrls = rules.reduce(function (urls, rule) {
      const { declarations } = rule;
      if (declarations === undefined) {
        return urls;
      }

      declarations.forEach(function (declaration) {
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
    const downloadTasks = assetUrls.map(function (url$$1) {
      return downloadUrl(url$$1, path.join(option.output, option.assetsFolder));
    });
    yield Promise.all([...downloadTasks, writeCss]);
  });

  function downloadMedias(_x3, _x4) {
    return _ref2.apply(this, arguments);
  }

  return downloadMedias;
})();

module.exports = main;
