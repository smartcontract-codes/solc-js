require('../utils/mock')();

const chai = require('chai');
chai.should();

const solcjs = require('../../src/index');

describe('solcjs', () => {

  it('latest', async () => {
    let compiler = await solcjs();
    compiler.should.be.a('function');
  });

  // ============= 0.1

  it('v0.1.7', async () => {
    let version = 'v0.1.7-stable-2015.11.30';
    let compiler = await solcjs(version);
    compiler.should.be.a('function');
  });

  it('v0.1.6', async () => {
    let version = 'v0.1.6-stable-2015.11.17';
    let compiler = await solcjs(version);
    compiler.should.be.a('function');
  });

  it('v0.1.5', async () => {
    let version = 'v0.1.5-stable-2015.10.19';
    let compiler = await solcjs(version);
    compiler.should.be.a('function');
  });

  it('v0.1.4', async () => {
    let version = 'v0.1.4-stable-2015.10.09';
    let compiler = await solcjs(version);
    compiler.should.be.a('function');
  });

  it('v0.1.3', async () => {
    let version = 'v0.1.3-stable-2015.09.30';
    let compiler = await solcjs(version);
    compiler.should.be.a('function');
  });

});