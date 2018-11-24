console.time('start')
const bel = require('bel')

const solcjs = require('./')
const selectVersion = require('./src/node_modules/version2url')

selectVersion((error, select) => {
  if (error) return console.error(error)
  const useVersion = (error, url) => {
    if (error) return console.error(error)
    console.log('url:', url)
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
  console.time('compile stuff')
  let source = `
  contract SimpleStorage {
    uint storedData;
    function set(uint x) public { storedData = x; }
    function get() public view returns(uint) { return storedData;}
  }`;
  let output = solc.compile(source)
  console.timeEnd('compile stuff')
  if (output && output.compiler) {
    // document.body.appendChild(bel`<h1>success</h1>`)  
    // console.dir(output);
    console.log('***   success   ***');
  } else {
    console.log('***   fail   ***');
  }
  // console.timeEnd('start')

  for (var error in output['errors']) {
    var message = output['errors'][error]
    if (message.match(/^(.*:[0-9]*:[0-9]* )?Warning: /)) console.log(message)
    else console.error(message)
  }

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
