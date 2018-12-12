require('../utils/mock')();

const chai = require('chai');
chai.should();

const solcjs = require('../../src/index');
const solcImport = require('../../src/lib/solc-import');

describe('import', () => {

  const version = 'v0.5.1-stable-2018.12.03';

  it('local', async () => {
    let compiler = await solcjs(version);
    compiler.should.be.a('function');

    const sourceCode = `
    pragma solidity >0.4.99 <0.6.0;

    import "lib.sol";

    library OldLibrary {
      function someFunction(uint8 a) public returns(bool);
    }

    contract NewContract {
      function f(uint8 a) public returns (bool) {
          return OldLibrary.someFunction(a);
      }
    }`;

    let localSources = [{
      path: 'lib.sol',
      content: 'library L { function f() internal returns (uint) { return 7; } }'
    }];

    let output = await compiler(sourceCode, localSources);
    let item = output[0];
    item.should.have.all.keys('name', 'abi', 'sources', 'compiler', 'assembly', 'binary', 'metadata');
    item.metadata.analysis.should.have.all.keys('warnings', 'others');
  });

  it('github', async () => {
    let compiler = await solcjs('v0.4.25-stable-2018.09.13');
    compiler.should.be.a('function');
    const sourceCode = `
    import 'https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol';

    library OldLibrary {
        function someFunction(uint8 a) public returns(bool);
    }

    contract NewContract {
        function f(uint8 a) public returns (bool) {
            return OldLibrary.someFunction(a);
        }
    }`;

    let output = await compiler(sourceCode);
    let item = output[0];
    item.should.have.all.keys('name', 'abi', 'sources', 'compiler', 'assembly', 'binary', 'metadata');
    item.metadata.analysis.should.have.all.keys('warnings', 'others');
  });

  it('parser import', async () => {
    const sourceCode = `
    import 'https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol';
    import 'SafeMath.sol';

    contract Casino {
        using SafeMath for uint256;
        function example(uint256 _value) {
            uint number = msg.value.add(_value);
        }
    }`;

    let result = solcImport.parserImports(sourceCode);
    result.should.be.a('array');
    result[1].should.be.eq('SafeMath.sol');
  });

  it('combineSource import', async () => {
    const sourceCode = `
    import 'https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol';
    import 'lib.sol';

    contract Casino {
        using SafeMath for uint256;
        function example(uint256 _value) {
            uint number = msg.value.add(_value);
        }
    }`;

    let localSources = [{
      path: 'lib.sol',
      content: 'library L { function f() internal returns (uint) { return 7; } }'
    }];

    let sources = await solcImport.combineSource(sourceCode, localSources);
    sources.should.be.a('array');
    sources[0].should.have.all.keys('path', 'content');
  });

});