const solcImport = require('solc-import');
const solcResolver = require('solc-resolver');
const solcjsCore = require('solcjs-core');

module.exports = getCompile;

function getCompile(oldSolc) {
  let compile;
  Object.keys(oldSolc).forEach(key => {
    if (key != 'compile') return;

    compile = async function (sourcecode = '', getImportContent) {
      if (solcImport.isExistImport(sourcecode)) {
        if (getImportContent == undefined) {
          getImportContent = solcResolver.getImportContent;
        } else if (typeof getImportContent !== 'function') {
          throw Error('getContent should be a funcion.');
        }
      }

      let readCallback = await solcjsCore.getReadCallback(
        sourcecode,
        getImportContent
      );
      return solcjsCore.wrapperCompile(oldSolc, sourcecode, readCallback);
    };
  });
  return compile;
}
