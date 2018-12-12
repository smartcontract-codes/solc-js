const combineSource = require('./combineSource');

module.exports = getReadCallback;

async function getReadCallback(sourceCode, localSources) {
  let sources = await combineSource(sourceCode, localSources);
  // console.log('=== sources ====');
  // console.log(sources);
  function readCallback(path) {
    for (let source of sources) {
      if (source.path == path) {
        return { contents: source.content }; 
      } 
    }
  }
  return readCallback;
}