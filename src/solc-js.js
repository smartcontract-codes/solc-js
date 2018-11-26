const ajax = require('ajax-cache')
const solcwrapper = require('solc-wrapper')
const version2url = require('version2url')

module.exports = solcjs

solcjs.version2url = version2url

function solcjs (compilerURL, done) {
  if (typeof done !== 'function') return
  if (typeof compilerURL !== 'string') return done(new Error('`compilerURL` must be a url string'))
  const request = { url: compilerURL, cache: true }
  console.time('[fetch compiler]')
  ajax(request, (error, compilersource) => {
    if (error) return done(error)
    console.timeEnd('[fetch compiler]')
    console.time('[load compiler]')
    const solc = load(compilersource)
    console.timeEnd('[load compiler]')
    // ----------------------------------------------------
    // console.debug('compiler length:', compilersource.length)
    // console.log(Object.keys(compiler).length)
    console.time('[wrap compiler]')
    const solcjs = solcwrapper(solc)
    console.timeEnd('[wrap compiler]')

    version2url((err, select) => {
      var all = select.all, curl = compilerURL
      all.forEach(v => select(v, (e, url) => url === curl && start(v, curl)))
    })

    function start (v, url) {
      // ----------------------------------------------------
      // try {
      //   // @NOTE: compiling a simple contract dummy seems to
      //   // warm up the compiler, so that it compiles faster later on
      //   // @TODO: also it somehow throws the first time ?!?
      //   var content = 'contract x { function g() public {} }'
      //   solcjs.compile(content)
      // } catch (e) {
      //   // console.error('wtf - first compile?!?', e)
      // }
      // console.timeEnd('load compiler')
      // // console.log(Object.keys(solc).length)
      // ----------------------------------------------------
      const source = 'contract x { function g() public {} }'
      // @NOTE: compiling a simple contract dummy seems to
      // warm up the compiler, so that it compiles faster later on
      solcjs.compile({ version: v, url }, source, (err, data) => {
        if (err) return done(new Error('this version of solc is incompatible with your browser'))
        // console.log(Object.keys(solc).length)
        // ----------------------------------------------------
        done(null, (s, ...args) => {
          if (typeof s === 'string') {
            s = [s]
            args = []
          }
          const source = args.map((a, i) => s[i] + a).join('') + s[s.length - 1]
          var x, done, listener = []
          // ----------------------------------------------------
          // var data = solcjs.compile(source)
          // var err = data.errors.length === 1 ? data.errors[0] : void 0
          // if (catcher && err) catcher(data.errors[0])
          // else if (thener) thener(data)
          // listener.forEach(done => done(err, data))
          // listener = []
          // x = [err, data]
          // ----------------------------------------------------
          solcjs.compile({ version: v, url }, source, (err, data) => {
            console.log('CONTRACTS', source)
            if (err) console.log('ERROR', err) // @TODO: trigger error listener
            else console.log('OUTPUT', data)
            if (err && done) done[0](err)
            else if (done) done[1](data)
            listener.forEach(done => done(err, data))
            listener = []
            x = [err, data]
          })
          // ----------------------------------------------------
          const output = done => (x && done(...x) || listener.push(done))
          output.then = (ok, ko) => x ? x[0] && ko(x[0]) || ok(x[1]) : (done = [ko, ok])
          return output
        })
      })
    }
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
