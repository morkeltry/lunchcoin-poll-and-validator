### arbitrary contract messaging

##### This repo provides boilerplate for a truffle migration invoving multiple contracts which talk to each other. The frontend allows selecting a contract and interacting with its public funcation.

Cross contract storage is based (in its most basic form) on Pranav Singhal's [truffle box](https://www.trufflesuite.com/boxes/upgradable-proxy-box) of OpenZeppelin's upgradable proxy pattern.
The repo will be extended to allow a choice of contracts (identified by a stored pointer) to validate arbitrary shaped data.

For converting this data, I have modified @Arachnid's [String and Slice utlity](https://github.com/Arachnid/solidity-stringutils), Viktor Agayev's[Strings and Bytes](https://gist.github.com/ageyev/779797061490f5be64fb02e978feb6ac) and Kevin Kaiser's [solidity type casting](https://github.com/KevK0/solidity-type-casting/tree/master/contracts) to compile with solc0.5.x


#### Installation
Let's assume you'll want truffle and ganache-cli installed globally
```
npm i -g truffle ganache-cli
```
```
npm install --save-dev  @nomiclabs/buidler
npm install --save-dev @nomiclabs/buidler-waffle
```
are not needed, but were originally used to provide availablility for multiple compilers. NB this are problematic to install globally.

```
truffle compile
```
if you have nmot already compiled.
Then always:
```
ganache-cli
truffle migrate
```
`ganache` can be run automatically, running the cli explicilty in its own terminal allows you to mointor addresses and transactions.

```
cd app
npm run start
```
opens the React app in the browser.

#### Troubleshooting
If the app chokes on on network constants being undefined, check that your `network` in `truffle-config.js` (if set) and `providerUrl` in `app/src/Web3/adminPanel.js` match your ganache URL (which is running, right? You do have a blockchain running?)
Alternatively, this may be a migration problem (eg due to async errors) which can fail silently during migration or remigration. Look in the console for whether all, or only some, artifacts are missing the correct network. After fixing any possbile problems, make sure to use ```truffle migrate --reset``` to explicitly rebuild.
