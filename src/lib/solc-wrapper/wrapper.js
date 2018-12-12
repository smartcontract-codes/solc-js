var translate = require('./translate.js');
var linker = require('./linker.js');

let soljson;

const assert = (bool, msg) => { if (!bool) throw new Error(msg); };

function wrapCallback(callback) {
  assert(typeof callback === 'function', 'Invalid callback specified.');
  return function (path, contents, error) {
    var result = callback(soljson.Pointer_stringify(path));
    if (typeof result.contents === 'string') copyString(result.contents, contents);
    if (typeof result.error === 'string') copyString(result.error, error);
  };
}

function copyString(str, ptr) {
  var length = soljson.lengthBytesUTF8(str);
  var buffer = soljson._malloc(length + 1);
  soljson.stringToUTF8(str, buffer, length + 1);
  soljson.setValue(ptr, buffer, '*');
}

function runWithReadCallback(readCallback, compile, args) {
  if (readCallback === undefined) {
    readCallback = function (path) {
      return {
        error: 'File import callback not supported'
      };
    };
  }

  // This is to support multiple versions of Emscripten.
  var addFunction = soljson.addFunction || soljson.Runtime.addFunction;
  var removeFunction = soljson.removeFunction || soljson.Runtime.removeFunction;

  var cb = addFunction(wrapCallback(readCallback));
  var output;
  try {
    args.push(cb);
    // console.log('=== cb ====');
    // console.log(cb);
    output = compile.apply(undefined, args);
  } catch (e) {
    removeFunction(cb);
    throw e;
  }
  removeFunction(cb);
  return output;
}

function getCompileJSON() {
  if ('_compileJSON' in soljson) {
    return soljson.cwrap('compileJSON', 'string', ['string', 'number']);
  }
}

function getCompileJSONMulti() {
  if ('_compileJSONMulti' in soljson) {
    return soljson.cwrap('compileJSONMulti', 'string', ['string', 'number']);
  }
}

function getCompileJSONCallback() {
  if ('_compileJSONCallback' in soljson) {
    var compileInternal = soljson.cwrap('compileJSONCallback', 'string', ['string', 'number', 'number']);
    var compileJSONCallback = function (input, optimize, readCallback) {
      return runWithReadCallback(readCallback, compileInternal, [input, optimize]);
    };
    return compileJSONCallback;
  }
}

// TODO:
function getCompileStandard() {
  var compileStandard;
  if ('_compileStandard' in soljson) {
    var compileStandardInternal = soljson.cwrap('compileStandard', 'string', ['string', 'number']);
    compileStandard = function (input, readCallback) {
      return runWithReadCallback(readCallback, compileStandardInternal, [input]);
    };
  }
  if ('_solidity_compile' in soljson) {
    var solidityCompile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);
    compileStandard = function (input, readCallback) {
      return runWithReadCallback(readCallback, solidityCompile, [input]);
    };
  }
  return compileStandard;
}

function getVersion() {
  let version;
  if ('_solidity_version' in soljson) {
    version = soljson.cwrap('solidity_version', 'string', []);
  } else {
    version = soljson.cwrap('version', 'string', []);
  }
  return version;
}

function getLicense() {
  let license;
  if ('_solidity_license' in soljson) {
    license = soljson.cwrap('solidity_license', 'string', []);
  } else if ('_license' in soljson) {
    license = soljson.cwrap('license', 'string', []);
  } else {
    // pre 0.4.14
    license = function () {};
  }
  return license;
}

function getWrapperFormat(sourcecode) {
  let input = {
    language: 'Solidity',
    settings: {
      optimizer: {
        enabled: true
      },
      metadata: {
        useLiteralContent: true
      },
      outputSelection: { '*': { '*': ['*'], '': ['*'] } }
    },
    sources: {
      'MyContract': {
        content: sourcecode
      }
    }
  };
  return input;
}


module.exports = wrapper;

function wrapper(_soljson) {
  soljson = _soljson;
  var compileJSON = getCompileJSON();
  var compileJSONMulti = getCompileJSONMulti();
  var compileJSONCallback = getCompileJSONCallback();
  var compileStandard = getCompileStandard();
  let version = getVersion();

  function compile(input, optimise, readCallback) {
    var result = '';
    if (version().indexOf('0.5.') != -1 || version().indexOf('0.4.') != -1) {
      result = compileStandardWrapper(JSON.stringify(getWrapperFormat(input)), readCallback);
    } else if (readCallback !== undefined && compileJSONCallback !== null) {
      result = compileJSONCallback(JSON.stringify(input), optimise, readCallback);
    } else if (typeof input !== 'string' && compileJSONMulti !== null) {
      result = compileJSONMulti(JSON.stringify(input), optimise);
    } else if (compileJSON != null) {
      result = compileJSON(input, optimise);
    } else {
      result = compileStandard(input, readCallback);
    }
    return JSON.parse(result);
  }

  function compileStandardWrapper (input, readCallback) {
    // Expects a Standard JSON I/O but supports old compilers
    if (compileStandard !== null) return compileStandard(input, readCallback);
    function formatFatalError (message) {
      return JSON.stringify({
        errors: [{
          'type': 'SOLCError',
          'component': 'solcjs',
          'severity': 'error',
          'message': message,
          'formattedMessage': 'Error: ' + message,
        }]
      });
    }
    if (readCallback !== undefined && typeof readCallback !== 'function') {
      return formatFatalError('Invalid import callback supplied');
    }
    input = JSON.parse(input);
    if (input['language'] !== 'Solidity') {
      return formatFatalError('Only Solidity sources are supported');
    }
    if (input['sources'] == null) return formatFatalError('No input specified');
    if ((input['sources'].length > 1) && (compileJSONMulti === null)) { // Bail out early
      return formatFatalError('Multiple sources provided, but compiler only supports single input');
    }
    function isOptimizerEnabled (input) {
      return input['settings'] && input['settings']['optimizer'] && input['settings']['optimizer']['enabled'];
    }
    function translateSources (input) {
      var sources = {};
      for (var source in input['sources']) {
        if (input['sources'][source]['content'] !== null) {
          sources[source] = input['sources'][source]['content'];
        } else return null;
        // force failure
      }
      return sources;
    }
    function librariesSupplied (input) {
      if (input['settings'] !== null) return input['settings']['libraries'];
    }
    function translateOutput (output) {
      output = translate.translateJsonCompilerOutput(JSON.parse(output));
      if (output == null) return formatFatalError('Failed to process output');
      return JSON.stringify(output);
    }
    var sources = translateSources(input);
    if (sources === null || Object.keys(sources).length === 0) {
      return formatFatalError('Failed to process sources');
    }
    
    // Try linking if libraries were supplied
    var libraries = librariesSupplied(input);

    // Try to wrap around old versions
    if (compileJSONCallback !== null) { 
      let sources = JSON.stringify({ sources });
      return translateOutput(compileJSONCallback(sources, isOptimizerEnabled(input), readCallback), libraries);
    }
    if (compileJSONMulti !== null) {
      let sources = JSON.stringify({ sources });
      return translateOutput(compileJSONMulti(sources, isOptimizerEnabled(input)), libraries);
    } // Try our luck with an ancient compiler
    return translateOutput(compileJSON(sources[Object.keys(sources)[0]], isOptimizerEnabled(input)), libraries);
  }

  function versionToSemver() { return translate.versionToSemver(version()); }
  let license = getLicense();

  return {
    version: version,
    semver: versionToSemver,
    license: license,
    compile: compile,
    compileStandard: compileStandard,
    compileStandardWrapper: compileStandardWrapper,
    linkBytecode: linker.linkBytecode,
    supportsMulti: compileJSONMulti !== null,
    supportsImportCallback: compileJSONCallback !== null,
    supportsStandard: compileStandard !== null,
  };
}
