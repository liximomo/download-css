'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var yargs = _interopDefault(require('yargs'));
var path = _interopDefault(require('path'));
var http = _interopDefault(require('http'));
var https = _interopDefault(require('https'));
var fs = _interopDefault(require('fs'));
var nodeFetch = _interopDefault(require('node-fetch'));
var css = _interopDefault(require('css'));
var fsExtra = _interopDefault(require('fs-extra'));
var url = _interopDefault(require('url'));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var downloadCss = createCommonjsModule(function (module) {
'use strict';

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var path$$1 = _interopDefault(path);
var http$$1 = _interopDefault(http);
var https$$1 = _interopDefault(https);
var fs$$1 = _interopDefault(fs);
var fetch = _interopDefault(nodeFetch);
var css$$1 = _interopDefault(css);
var fse = _interopDefault(fsExtra);
var url$$1 = _interopDefault(url);

function urlToPath(urlStr) {
  const parsedUrl = url$$1.parse(urlStr);
  const port = parsedUrl.port ? `:${parsedUrl.port}` : '';
  const prefix = `${parsedUrl.protocol}//${parsedUrl.host}${port}`;
  const basePath = path$$1.dirname(parsedUrl.pathname);
  const name = path$$1.basename(parsedUrl.pathname);
  const ext = path$$1.extname(parsedUrl.pathname);
  return {
    prefix,
    basePath,
    name,
    ext
  };
}

function _asyncToGenerator(fn) {
  return function () {
    var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);var value = info.value;
        } catch (error) {
          reject(error);return;
        }if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }return step("next");
    });
  };
}

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
      const filename = path$$1.join(out, pathInfo.name);
      const dir = path$$1.dirname(filename);
      yield fse.ensureDir(dir);
      const file = fs$$1.createWriteStream(filename);
      const request = url$$1.indexOf('https') === 0 ? https$$1 : http$$1;
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
    const ast = css$$1.parse(cssContent);
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

        let fullpath = path$$1.join(assetPath.basePath, assetPath.name);
        if (!path$$1.isAbsolute(fullpath)) {
          fullpath = path$$1.resolve(assetBasePath, fullpath);
        }

        const finalUrl = `${cssPath.prefix}${fullpath}`;
        urls.push(finalUrl);

        // url rewrite
        const newUrlPrefix = rewriteUrl.endsWith('/') ? rewriteUrl.slice(0, rewriteUrl.length - 1) : rewriteUrl;

        // eslint-disable-next-line no-param-reassign
        declaration.value = `url(${newUrlPrefix}/${assetPath.name})`;
      });
      return urls;
    }, []);

    const writeCss = fse.outputFile(path$$1.join(option.output, cssFileName), css$$1.stringify(ast));
    const downloadTasks = assetUrls.map(function (url$$1) {
      return downloadUrl(url$$1, path$$1.join(option.output, option.assetsFolder));
    });
    yield Promise.all([...downloadTasks, writeCss]);
  });

  function downloadMedias(_x3, _x4) {
    return _ref2.apply(this, arguments);
  }

  return downloadMedias;
})();

module.exports = main;
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const packageInfo = require('../package.json');

const PATH_CWD = process.cwd();
function getAbsolutePath(filename) {
  return path.isAbsolute(filename) ? filename : path.join(PATH_CWD, filename);
}

const args = yargs.version(packageInfo.version).usage('Usage: $0 [option] <url ...>').option('out', {
  alias: 'o',
  default: PATH_CWD,
  demandOption: false,
  describe: 'output folder',
  type: 'string',
  coerce: getAbsolutePath
}).option('assets-folder', {
  alias: 'a',
  default: 'assets',
  demandOption: false,
  describe: 'assets folder',
  type: 'string'
}).option('name', {
  alias: 'n',
  demandOption: false,
  describe: 'css filename',
  type: 'string'
}).option('rewrite-url', {
  alias: 'r',
  demandOption: false,
  describe: 'rewrite url',
  type: 'string'
}).option('ext', {
  alias: 'e',
  demandOption: false,
  describe: 'extensions to download',
  type: 'string'
}).help().argv;

if (args._.length <= 0) {
  yargs.showHelp();
  // console.error(`${packageInfo.name}: require url be provided`);
  process.exit(-1);
}

_asyncToGenerator(function* () {
  const tasks = args._.map(function (url$$1) {
    return downloadCss(url$$1, {
      avalialeExtensions: args.ext,
      output: args.out,
      assetsFolder: args['assets-folder'],
      name: args.name,
      rewriteUrl: args['rewrite-url']
    });
  });

  try {
    yield Promise.all(tasks);
  } catch (error) {
    console.log(`error: ${error.message}`);
    process.exit(-1);
  }

  console.log('downlod done');
})();
