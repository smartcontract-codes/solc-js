console.time('start')
const bel = require('bel')

const solcjs = require('./')
const selectVersion = require('./lib/version2url')

selectVersion((error, select) => {
  if (error) return console.error(error)
  const useVersion = (error, url) => {
    if (error) return console.error(error)
    console.log(url)
    solcjs(url, start)
  }
  const { releases, nightly, all} = select
  select(releases[0], useVersion)
  document.body.appendChild(selector(releases, v => select(v, useVersion)))
})

function selector (list, action) {
  const onchange = event => action(event.target.value)
  return bel`
    <select onchange=${onchange}>
      ${list.map(x => bel`<option value="${x}">${x}</option>`)}
    </select>`
}

function start (error, solc) {
  if (error) return console.error(error)
  var input = ''
  console.time('compile stuff')
  var output = solc.compile(input, 1)
  console.timeEnd('compile stuff')
  document.body.appendChild(bel`
    <h1> success </h1>
  `)
  console.timeEnd('start')
  console.log(output)

  for (var error in output['errors']) {
    var message = output['errors'][error]
    if (message.match(/^(.*:[0-9]*:[0-9]* )?Warning: /)) console.log(message)
    else console.error(message)
  }

  const OUTPUT = {
    '.bin': output.contracts[contractName].bytecode,
    '.abi': output.contracts[contractName].interface,
    'errors': output.errors,
  }

  // console.time('compile stuff')
  // console.log(solc.compile(input, 1))
  // console.timeEnd('compile stuff')
  // console.log("compiler", solc)
  // testCompiler(solc)
}


function testCompiler (solc) {
  var input1 = 'contract x { function g() {} }'
  var input2 = 'contract y { function f() {} }'
  // Setting 1 as second paramateractivates the optimiser
  function compile (input) {
    console.time('compile')
    var output = solc.compile(input, 1)
    console.timeEnd('compile')
    console.log('output', output)
  }
  var id = setInterval(() => {
    compile(input1)
  }, 500)
  setTimeout(() => {
    console.log('====================')
    clearInterval(id)
    id = setInterval(() => {
      compile(input2)
    }, 500)
    setTimeout(() => {
      clearInterval(id)
    }, 5000)
  }, 5000)
}
