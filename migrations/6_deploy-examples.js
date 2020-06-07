/*
@author Arvind Kalra (github.com/arvindkalra) and Pranav Singhal (github.com/pranav-singhal)
*/

const Poll = artifacts.require("./PollReference.sol");
const Validator = artifacts.require("./MutualAgreement.sol");

module.exports = async function(deployer, network, accounts) {
  // console.log(await Validator.address);
  // console.log(await Validator.networks);
  let owner = accounts[0];
  await deployer.deploy(Poll, {from:owner});
  await deployer.deploy(Validator, {from:owner});
  Poll.at(Poll.address).then(poll => {
    // poll["setValidator1"](Validator.address).then(() => {
      Validator.at(Validator.address).then(validator => {
        console.log(`We have Validator at ${Validator.address}`);
        // validator["setPollAddress"](Poll.address).then(() => {
          console.log("That's a done :)");
        // });
      });
    // });
  });
};
