require('../utils/mock')();
const chai = require('chai');
chai.should();

const solcjs = require('../../src/index');

describe('error', () => {

  it('case 1', async () => {
    let compiler = await solcjs('v0.4.24-stable-2018.05.16');
    const sourceCode = `
     contract Mortal {
      address publi owner;
      constructor() public { owner = msg.sender; }
      function kill() public { if (msg.sender == owner) selfdestruct(owner); }
    }
     contract Greeter is Mortal {
      string public greeting;
      constructor(string memory _greeting) public {
        greeting = _greeting;
      }
    }`;
    try {
      await compiler(sourceCode);  
    } catch (error) {
      error.should.have.all.keys('component', 'formattedMessage', 'message', 'type');
      error.type.should.be.equal('ParserError');
    }
  });
});