const ajax = require('ajax-cache')
const solcwrapper = require('solc-wrapper')
const version2url = require('version2url')

module.exports = solcjs

solcjs.version2url = version2url

function solcjs (compilerURL, done) {
  if (typeof done !== 'function') return
  if (typeof compilerURL !== 'string') return done(new Error('`compilerURL` must be a url string'))
  const request = { url: compilerURL, cache: true }
  console.time('fetch compiler')
  ajax(request, (error, compilersource) => {
    if (error) return done(error)
    console.timeEnd('fetch compiler')
    const compiler = load(compilersource)
    // ----------------------------------------------------
    // console.debug('compiler length:', compilersource.length)
    // console.log(Object.keys(compiler).length)
    console.time('load compiler')
    const solc = solcwrapper(compiler)
    try {
      // @NOTE: compiling a simple contract dummy seems to
      // warm up the compiler, so that it compiles faster later on
      // @TODO: also it somehow throws the first time ?!?
      solc.compile('contract x { function g() {} }', 1)
    } catch (e) {
      console.error('wtf - first compile?!?', e)
    }
    console.timeEnd('load compiler')
    // console.log(Object.keys(solc).length)
    const api = solc
    // ----------------------------------------------------
    done(null, api)
  })
}
/******************************************************************************
  HELPER
******************************************************************************/
function load (sourcecode) {
  var script = document.createElement('script')
  if ('Module' in window) {
    var oldModule = window.Module
    var exists = true
  } else window.Module = {}
  script.text = `window.Module=((Module)=>{${sourcecode};return Module})()`
  document.head.appendChild(script)
  document.head.removeChild(script)
  const compiler = window.Module
  if (exists) window.Module = oldModule
  else delete window.Module
  return compiler
}
/*****************************************************************************/
function load2 (compilersource) {
  console.time('load compiler')
  const stop = loading()
  // var workerScript = `
  var workerScript = `${compilersource};
    self.onmessage = function (e) {
      self.postMessage('Worker: ' + e.data)
      self.close()
    }
    try {
      self.postMessage(!!self.Module)
      const x = {a : 5}
      self.postMessage({ x: x }, [x])
      // self.postMessage(self.Module)
    } catch (e) {
      self.postMessage('error', e.message)
      // self.postMessage(e)
    }`
  var blob = new Blob([workerScript], { type: 'application/javascript' })
  var opts = { type: 'application/javascript; charset=utf-8' }
  var blobURL = window.URL.createObjectURL(blob, opts)
  var worker = new Worker(blobURL)
  worker.onmessage = function(e) {
    console.timeEnd('load compiler')
    console.log('Response: ' + e.data)
    stop()
  }
  worker.onerror = function (e) {
    console.timeEnd('load compiler')
    console.error(e.stack)
    console.error(e)
    console.log('deleting', blobURL)
    window.URL.revokeObjectURL(blobURL)
    stop()
  }
  var input = 'compile something'
  console.log(input)
  worker.postMessage(input/*, buffers */)
  // doXHR(blobURL)
  return ''
}

function doXHR (blobURL) {
  var xhr = new XMLHttpRequest()
  console.log(blobURL)
  xhr.open('GET', blobURL, true)
  // xhr.responseType = 'text'
  xhr.responseType = 'blob'
  xhr.onreadystatechange = function () {
    if(xhr.DONE !== xhr.readyState) return
    console.log(xhr.response)
  }
  xhr.send()
}

function loading () {
  const loader = document.createElement('div')
  loader.innerHTML = '... loading compiler ...'
  var inDOM
  document.body.appendChild(loader)
  console.log('loading ... ')
  inDOM = !inDOM
  const id = setInterval(() => {
    console.log('loading ... ')
    document.body[inDOM ? 'removeChild' : 'appendChild'](loader)
    inDOM = !inDOM
  }, 100)
  return () => {
    clearInterval(id)
    if (inDOM) {
      inDOM = null
      document.body.removeChild(loader)
    }
  }
}
// /******************************************************************************
//   VERSIONS
// ******************************************************************************/
//
// function v0_0_0_plus () {
//   // From early versions
//   // it can also be included and used in other projects
//   var solc = require('solc')
//   var input = 'contract x { function g() {} }'
//   // Setting 1 as second paramateractivates the optimiser
//   var output = solc.compile(input, 1)
//   for (var contractName in output.contracts) {
//       // code and ABI that are needed by web3
//       console.log(contractName + ': ' + output.contracts[contractName].bytecode)
//       console.log(contractName + '; ' + JSON.parse(output.contracts[contractName].interface))
//   }
// }
// function v0_1_6_plus () {
//   // From version 0.1.6
//   // multiple files are supported with automatic import resolution
//   // by the compiler as follows
//   var input = {
//       'lib.sol': 'library L { function f() returns (uint) { return 7; } }',
//       'cont.sol': 'import "lib.sol"; contract x { function g() { L.f(); } }'
//   }
//   var output = solc.compile({ sources: input }, 1)
//   for (var contractName in output.contracts)
//       console.log(contractName + ': ' + output.contracts[contractName].bytecode)
// }
// function v0_2_1_plus () {
//   // From version 0.2.1
//   // a callback is supported to resolve missing imports as follows
//   /*
//   The compile() method always returns an object, which can contain errors,
//   sources and contracts fields.
//   errors is a list of error mesages
//   */
//   var solc = require('solc')
//   var input = {
//       'cont.sol': 'import "lib.sol"; contract x { function g() { L.f(); } }'
//   }
//   function findImports (path) {
//       if (path === 'lib.sol')
//           return { contents: 'library L { function f() returns (uint) { return 7; } }' }
//       else
//           return { error: 'File not found' }
//   }
//   var output = solc.compile({ sources: input }, 1, findImports)
//   for (var contractName in output.contracts)
//       console.log(contractName + ': ' + output.contracts[contractName].bytecode)
// }
// function v0_4_11_plus () {
//   // From version 0.4.11
//   // Starting from version 0.4.11 there is a new entry point
//   // named compileStandardWrapper() which supports
//   // https://solidity.readthedocs.io/en/develop/using-the-compiler.html#compiler-input-and-output-json-description
//   // => Solidity's standard JSON input and output.
//   // It also maps old compiler output to it.
//   // => outputs a link references map
//   // => This gives a map of library names to offsets in the bytecode to replace the addresses at
//   //  It also doesn't have the limitation on library file and contract name lengths
//   /*
//   There is also a direct method, compileStandard, which is only present on
//   recent compilers and works the same way. compileStandardWrapper
//   is preferred however because it provides the same interface for old compilers.
//   */
//   var solc = require('solc')
//
//   // 'input' is a JSON string corresponding to the "standard JSON input" as described in the link above
//   // 'findImports' works as described above
//   var output = solc.compileStandardWrapper(input, findImports)
//   // Ouput is a JSON string corresponding to the "standard JSON output"
// }
// function v0_4_20_plus () {
//   // From version 0.4.20
//   /*
//   Starting from version 0.4.20 a Semver compatible version number can be
//   retrieved on every compiler release, including old ones,
//   using the semver() method.
//   */
// }
//
// /******************************************************************************
//   LOAD COMPILER
// ******************************************************************************/
// function loadCompiler (version, next) {
//   // API:
//   // In order to compile contracts using a specific version of Solidity,
//   // the solc.loadRemoteVersion(version, callback) method is available.
//   // This returns a new solc object that uses a version of the compiler specified
//   //
//   // You can also load the "binary" manually and use setupMethods
//   // to create the familiar wrapper functions described above:
//   // var solc = solc.setupMethods(require("/my/local/soljson.js"))
//
//   var solc = require('solc')
//   // getting the development snapshot
//   solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
//       if (err) {
//           // An error was encountered, display and quit
//       }
//       var output = solcSnapshot.compile("contract t { function g() {} }", 1)
//       next(null, solcSnapshot)
//   })
// }
// /******************************************************************************
//   LINKING BYTECODE
// ******************************************************************************/
// function linkByteCode ({ unlinkedByteCode, libAddressMap }, next) {
//   // LINKING BYTECODE
//   // When using libraries, the resulting bytecode will contain placeholders
//   // for the real addresses of the referenced libraries.
//   // These have to be updated, via a process called linking,
//   // before deploying the contract.
//
//   // The linker module
//   // (require('solc/linker'))
//   // offers helpers to accomplish this.
//
//   // The linkBytecode method provides a simple helper for linking:
//   var linker = require('solc/linker')
//   libAddressMap = libAddressMap || { 'MyLibrary': '0x123456...' }
//   bytecode = linker.linkBytecode(unlinkedByteCode, libAddressMap)
//   // Note: linkBytecode is also exposed via solc as solc.linkBytecode,
//   // but this usage is deprecated.
//
//   /*
//     There is a method available in the linker module called findLinkReferences
//     which can find such link references in bytecode produced
//     by an older compiler:
//   */
//   var linker = require('solc/linker')
//   var linkReferences = linker.findLinkReferences(bytecode)
//
//   const linkedByteCode = bytecode
//   next(null, linkedByteCode)
// }
// /******************************************************************************
//   FORMAT ASSEMBLY JSON
// ******************************************************************************/
// function formatJSON ({ assemblyJSON, sourceCode }, next) {
//   // Formatting old JSON assembly output
//   //
//   // There is a helper available to format old JSON assembly output
//   // into a text familiar to earlier users of Remix IDE
//   var translate = require('solc/translate')
//
//   // assemblyJSON refers to the JSON of the given assembly and sourceCode is the source of which the assembly was generated from
//   var output = translate.prettyPrintLegacyAssemblyJSON(assemblyJSON, sourceCode)
//
//   next(null, output)
// }
// /******************************************************************************
//   UPDATE ABI
// ******************************************************************************/
// function updateABI ({ version, oldABI }, next) {
//   // UPDATING THE ABI
//   /*
//     The ABI generated by Solidity versions can differ slightly,
//     due to new features introduced.
//     There is a tool included which aims to translate the ABI generated
//     by an older Solidity version to conform to the latest standard
//   */
//   var abi = require('solc/abi')
//
//   var inputABI = [{"constant":false,"inputs":[],"name":"hello","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
//   var outputABI = abi.update('0.3.6', inputABI)
//   // Output contains: [{"constant":false,"inputs":[],"name":"hello","outputs":[{"name":"","type":"string"}],"payable":true,"type":"function"},{"type":"fallback","payable":true}]
//
//   const newABI = outputABI
//   next(null, newABI)
// }
