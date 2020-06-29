### lunchcoin

##### This is not the boilerplate, but includes some updates to the generic frontend for accessing contract functions


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
if you have not already compiled.
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

#### Deployment (heroku)

Currently migration is a manual build step.
As heroku accepts the `master` branch, `master` is production and all development is on `dev` and its descendants.
`git checkout master`
`truffle migrate --network thunder-mainnet`
ensure that `app/src/contracts/` is NOT `.gitignore`d before committing.

Don't attempt to deploy the entire branch, as it will be a pain to remove. You need to deploy the React ap subtree:
`git subtree push --prefix app heroku master`


#### Troubleshooting
If the app chokes on on network constants being undefined, check that your `network` in `truffle-config.js` (if set), check whether React components use `app/src/src_testing/Web3/adminPanel.js` or `app/src/Web3/accessChain.js` and whether that file and `providerUrl` match your ganache URL (which is running, right? You do have a blockchain running?)
Alternatively, this may be a migration problem (eg due to async errors) which can fail silently during migration or remigration. Look in the console for whether all, or only some, artifacts are missing the correct network. After fixing any possbile problems, make sure to use ```truffle migrate --reset``` to explicitly rebuild.

If only the function accessor frontend shows, check index.html and index.js. They may be pointing to `<TestingApp>`.

If, after editing the metacode of a contract (ie types, visibility, rather than instructions) and recompiling, the contract gives the same erros as previously, or new VM errors, you must run `truffle compile --all` and not just `trfufle migrate --reset`. Check in the output that recompliation is actually happening and if not, remove theh artfiacts of any contracts which were changed from `app/src/contracts` before migrating again.

Consider always passing explicit compiler and EVM versions to truffle (as well as to compiler) as there have been a lot of unexplained VM errors.

