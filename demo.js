console.time('[start]');
const bel = require('bel');
const sca = require('smartcontract-app');
const solcjs = require('./');

function selector(list, action) {
  const onchange = event => action(event.target.value);
  return bel`
    <select onchange=${onchange}>
      ${list.map(x => bel`<option value="${x}">${x}</option>`)}
    </select>`;
}

async function useVersion(version) {
  try {
    console.time('[compile]');
    let compiler = await solcjs(version);
    let output = await compiler(`
    contract Mortal {
      address public owner;
      constructor() public { owner = msg.sender; }
      function kill() { if (msg.sender == owner) selfdestruct(owner); }
    }

    contract Greeter is Mortal {
      string public greeting;
      constructor(string memory _greeting) public {
        greeting = _greeting;
      }
    }`);
    console.timeEnd('[compile]');

    console.log('***   success   ***');
    document.body.appendChild(bel`<h1>success</h1>`);
    console.log('[output]', output);

    var opts = {
      metadata: {
        compiler: { version: output[0].compiler.version },
        language: output[0].compiler.language,
        output: {
          abi: output[0].abi,
          devdoc: output[0].metadata.devdoc,
          userdoc: output[0].metadata.userdoc
        },
        settings: {
          compilationTarget: { '': output[0].sources.compilationTarget },
          evmVersion: output[0].compiler.evmVersion,
          libraries: output[0].sources.libraries,
          optimizer: { enabled: output[0].compiler.optimizer, runs: output[0].compiler.runs },
          remapings: output[0].sources.remappings
        },
        sources: { '': output[0].sources.sourcecode }
      }
    };
    var el = sca(opts);
    document.body.appendChild(el);
  } catch (error) {
    console.log('***   fail   ***');
    document.body.appendChild(bel`<h1>fail</h1>`);
    console.error('[error]', error);
  } finally {
    console.timeEnd('[start]');
  }
}

async function start() {
  let select = await solcjs.versionsSkipVersion5();
  const { releases } = select;
  const version = releases[0];
  await useVersion(version);
  document.body.appendChild(selector(releases, v => useVersion(v)));
}

start();