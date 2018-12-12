
let solcjs = require('./lib/solc');
let solcVersion = require('solc-version');

module.exports = solcjs;

solcjs.versions = solcVersion.versions;
solcjs.versionsSkipVersion5 = solcVersion.versionsSkipVersion5;
solcjs.version2url = solcVersion.version2url;
solcjs.ABI = require('./lib/solc-wrapper/abi');
