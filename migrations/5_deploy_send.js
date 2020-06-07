const TokenProxy = artifacts.require("./TokenProxy.sol");
const TokenStorage = artifacts.require("./TokenStorage.sol");
const Poll = artifacts.require("./PollReference.sol");
const Validator = artifacts.require("./MutualAgreement.sol");

module.exports = function(deployer, network, accounts) {
  TokenStorage.at(TokenStorage.address).then(storage => {
    storage["setProxyContract"](TokenProxy.address).then(() => {
      Poll.at(TokenProxy.address).then(poll => {
        poll["setFlag"](321).then(() => {});
      });
      Validator.at(TokenProxy.address).then(poll => {
        poll["setFlag"](123).then(() => {});
      });
    });
  });
};
