import yargs from 'yargs';
import path from 'path';
import downloadCss from '../dist/download-css';

const packageInfo = require('../package.json');

const PATH_CWD = process.cwd();
function getAbsolutePath(filename) {
  return path.isAbsolute(filename) ? filename : path.join(PATH_CWD, filename);
}

const args = yargs
  .version(packageInfo.version)
  .usage('Usage: $0 [option] <url ...>')
  .option('out', {
    alias: 'o',
    default: PATH_CWD,
    demandOption: false,
    describe: 'output folder',
    type: 'string',
    coerce: getAbsolutePath,
  })
  .option('assets-folder', {
    alias: 'a',
    default: 'assets',
    demandOption: false,
    describe: 'assets folder',
    type: 'string',
  })
  .option('name', {
    alias: 'n',
    demandOption: false,
    describe: 'css filename',
    type: 'string',
  })
  .option('rewrite-url', {
    alias: 'r',
    demandOption: false,
    describe: 'rewrite url',
    type: 'string',
  })
  .option('ext', {
    alias: 'e',
    demandOption: false,
    describe: 'extensions to download',
    type: 'string',
  })
  .help()
  .argv;

if (args._.length <= 0) {
  yargs.showHelp();
  // console.error(`${packageInfo.name}: require url be provided`);
  process.exit(-1);
}

(async () => {
  const tasks = args._.map(url =>
    downloadCss(url, {
      avalialeExtensions: args.ext,
      output: args.out,
      assetsFolder: args['assets-folder'],
      name: args.name,
      rewriteUrl: args['rewrite-url'],
    }));

  try {
    await Promise.all(tasks);
  } catch (error) {
    console.log(`error: ${error.message}`);
    process.exit(-1);
  }

  console.log('downlod done');
})();
