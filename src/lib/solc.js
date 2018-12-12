const pretest = require('./pretest');
const loadModule = require('./loadModule');

const ajaxCaching = require('ajax-caching');
const promiseAjax = ajaxCaching.promiseAjax;

const getCompile = require('./getCompile');
const solcWrapper = require('./solc-wrapper/wrapper');
const solcVersion = require('solc-version');

function solcjs(_version) {
  return new Promise(async (resolve, reject) => {
    try {
      let version = await getVersion(_version);

      console.time('[fetch compiler]');
      let url = await solcVersion.version2url(version);
      let compilersource = await getCompilersource(url);
      console.timeEnd('[fetch compiler]');

      console.time('[load compiler]');
      const solc = loadModule(compilersource);
      console.timeEnd('[load compiler]');

      console.time('[wrap compiler]');
      let _compiler = solcWrapper(solc);
      _compiler.opts = { version, url };
      const newCompile = getCompile(_compiler);
      newCompile.version = { name: version, url };
      console.timeEnd('[wrap compiler]');

      try {
        await pretest(newCompile, version);
        resolve(newCompile);
      } catch (err) {
        console.error(err);
        if (err) return reject(new Error('this version of solc is incompatible with your browser'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function getVersion(_version) {
  if (typeof _version !== 'string') {
    let select = await solcVersion.versions();
    return select.releases[0];
  } else {
    return _version;
  }
}

async function getCompilersource(compilerURL) {
  try {
    const opts = {
      url: compilerURL,
      caching: true,
      transform: function (data) {
        if (data.substring(0, 10) != 'var Module') {
          throw Error('get compiler source fail');
        }
        return data;
      }};
    return await promiseAjax(opts);
  } catch (error) {
    throw error;
  }
}

module.exports = solcjs;