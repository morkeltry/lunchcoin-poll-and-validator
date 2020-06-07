const TokenProxy = artifacts.require("./TokenProxy.sol");
const Poll = artifacts.require("./PollReference.sol");
const Validator = artifacts.require("./MutualAgreement.sol");
const TokenStorage = artifacts.require("./TokenStorage.sol");

module.exports = function(deployer, network, accounts) {
  let owner = accounts[0];
  deployer.deploy(TokenProxy, Validator.address, TokenStorage.address, {
    from: owner
  });
};
