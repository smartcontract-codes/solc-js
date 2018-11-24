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
    const solc = load(compilersource)
    // ----------------------------------------------------
    // console.debug('compiler length:', compilersource.length)
    // console.log(Object.keys(compiler).length)
    console.time('load compiler')
    const solcjs = solcwrapper(solc)
    try {
      // @NOTE: compiling a simple contract dummy seems to
      // warm up the compiler, so that it compiles faster later on
      // @TODO: also it somehow throws the first time ?!?
      var content = 'contract x { function g() public {} }'
      solcjs.compile(content)
    } catch (e) {
      // console.error('wtf - first compile?!?', e)
    }
    console.timeEnd('load compiler')
    // console.log(Object.keys(solc).length)
    // ----------------------------------------------------
    done(null, solcjs)
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
