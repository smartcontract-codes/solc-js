module.exports = parserImport;

function parserImport(source) {
  // console.log('=== parserImport ====');
  // console.log(source);
  let matches = [];
  let ir = /^(.*import){1}(.+){0,1}\s['"](.+)['"];/gm;
  let match = null;
  while ((match = ir.exec(source))) {
    matches.push(match[3]);
  }
  return matches;
}