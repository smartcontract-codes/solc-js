const parser = require('./parser');
const Resolver = require('./resolver');
let resolver = new Resolver();

module.exports = combineSource;

async function combineSource(source, localSources = []) {
  try {
    const importPaths = parser(source);
    // console.log('=== importPaths ====');
    // console.log(importPaths);
    let sources = [];
    for (let path of importPaths) {
      if (isLocalPath(path)) continue;
      let content = await getContent(path);
      // console.log('content:\n', content);
      sources.push({ path, content });
    }
    if (localSources.length > 0) sources = sources.concat(localSources);
    return sources;
  } catch (error) {
    throw(error);
  }
}

function isLocalPath(path) {
  let found = false;
  resolver.handlers().forEach(function (handler) {
    if (found) {
      return;
    }

    var match = handler.match.exec(path);
    if (match) {
      found = true;
    }
  });
  return !found;
}

async function getContent(path) {
  return new Promise(function (resolve, reject) {
    try {
      resolver.import(path, console.log, function (err, obj) {
        if (err) reject(err);
        resolve(obj);
      });
    } catch (error) {
      reject(error);
    }
  });
}