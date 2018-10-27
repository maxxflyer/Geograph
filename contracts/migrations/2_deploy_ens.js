var ENSRegistry = artifacts.require("./ENSRegistry.sol");
var FIFSRegistrar = artifacts.require("./FIFSRegistrar.sol");
var PublicResolver = artifacts.require("./PublicResolver.sol");
var AdResolver = artifacts.require("./AdResolver.sol");

const zero = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = function(deployer) {
  deployer.deploy(ENSRegistry)
    .then(() => deployer.deploy(FIFSRegistrar, ENSRegistry.address, zero))
    .then(() => deployer.deploy(PublicResolver, ENSRegistry.address))
    .then(() => deployer.deploy(AdResolver, ENSRegistry.address));
};
