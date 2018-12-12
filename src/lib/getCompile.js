const format = require('./solc-wrapper/format.js');
const solcImport = require('./solc-import');

const R = /^(.*):(\d+):(\d+):(.*):/;

module.exports = getCompile;

function getCompile(oldSolc) {
  let compile;

  Object.keys(oldSolc).forEach(key => {
    if (key != 'compile') return;

    compile = async function (sourcecode = '', localSources) {
      let readCallback = await solcImport.getReadCallback(sourcecode, localSources);

      return new Promise(function (resolve, reject) {
        var data = oldSolc.compile(sourcecode, 1, readCallback);
        // console.log('=== key ====\n', Object.keys(data));
        // compileLog(data);
        if (!data.contracts) throw Error('compile fail');
        if (!Object.keys(data.contracts).length) {
          let err = data.errors[0];
          if (typeof err === 'string') err = getStandardError(err);
          return reject(err);
        }
        var output = format(oldSolc.opts, data);
        resolve(output);
      });
    };
  });
  return compile;
}

function getStandardError(err) {
  let type = R.exec(err);
  type = type ? type[4].trim() : 'Error';
  return {
    component: 'general',
    formattedMessage: err,
    message: err,
    type
  };
}

// function getNewCompiler(oldSolc) {
//   const newSolc = {};
//   newSolc.compile = getCompile(oldSolc);
// setFunctions(oldSolc, newSolc);
// setProperties(oldSolc, newSolc);
//   console.log('newSolc:\n', newSolc);
//   return newSolc.compile;
// }

// function compileLog(data) {
//   // console.log('=== compileLog ===');
//   // console.log('data:\n', data);
//   var fs = require('fs');
//   var util = require('util');
//   fs.writeFileSync('./compile.json', util.inspect(data, true, 10), 'utf-8');
// }