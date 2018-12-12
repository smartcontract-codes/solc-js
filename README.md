# solc-js
**`!!! this module is work in progress !!!`**

---

cross-browser solidity compiler for the web

**smaller and faster alternative to [solc](https://www.npmjs.com/package/solc) for browser-only environments**
* JavaScript bindings for the [solidity compiler](https://github.com/ethereum/solidity)
* Uses the emscripten compiled solidity found in the [solc-bin repository](https://github.com/ethereum/solc-bin)

In nodejs you can instead use [solc](https://www.npmjs.com/package/solc) or [solc-native](https://www.npmjs.com/package/solc-native)

### usage
[`npm install solc-js`](https://www.npmjs.com/package/solc-js)
```js
const solcjs = require('solc-js')

const list // can be:
// 1. [optional] URL to fetch compiler version list from custom url
// 2. or [optional] object of versions mapped to download urls for versions

const {
  // @NOTE: if the solidity team indicates the following:
  // @TODO: should we also allow for labels like?
  // latest,
  // next,
  // stable,
  all,     // array of all versions
  release, // array of all release versions only
  nightly, // array of all nightly versions only
} = await solcjs.versions(list/* if undefined, uses internal DEFAULT `url` */)

var compiler
try {
  const version = nightly[0]
  compiler = await solcjs(version/*if undefined, uses latest release */)
  const { name, url } = compiler.version
  console.log(name) // name === nightly[0]
  console.log(url)  // e.g. https://.....
} catch (e) {
  console.error('version not available')
}

// custom mechanism to import code used by solidity contracts
compiler.on(async import_url => await fetch(import_url))

// USE
const output1 = await compiler`...code...`
const output2 = await compiler(`...code...`)
console.log(output1)
console.log(output2)
// OR
const compileA = compiler`...code...`
const compileB = compiler(`...code...`)
const [outputA, outputB] = [await compileA, await compileB]
console.log(outputA)
console.log(outputB)
```

### Standard Output Format

```js
{
  "abi": [{…}, {…}],
  "contractName": "SimpleStorage",
  "errors": [{…}],
  "metadata": {compiler: {…}, language: "Solidity", output: {…}, settings: {…}, sources: {…}, …},
  "success": true,
  "version": "0.5.0+commit.1d4f565a"
}
```

### contribute
feel free to make pull requests or file issues [here](https://github.com/ethereum/play/issues)