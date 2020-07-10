
import Web3 from "web3";

import TokenProxyArtifacts from "../contracts/TokenProxy.json";
import PollArtifacts from "../contracts/PollReference.json";
import ValidatorArtifacts from "../contracts/MutualAgreement.json";

const envVars = Object.keys(process.env);
if (envVars.length>2)
  console.log(envVars);



// const environment = 'production';
const environment = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'production';
let authWeb3Type = environment==='production' ? 'browser' : 'local';

let providerUrl = {
  development : 'ws://127.0.0.1:8545',
  production: 'wss://mainnet-ws.thundercore.com/:8545'
}[environment];
let wsRetries=2;
let web3;
let authWeb3;
let wsProvider = new Web3.providers.WebsocketProvider(providerUrl,{timeout: 4800000} );
let wpUp = true;
let awaitAccess;

web3 = new Web3(wsProvider);
if (!web3.eth.net)
  console.log(`Did not get web3.eth.net from ${providerUrl}. Maybe check the port number?`);
if (environment!== 'production'){
  console.log(`Running in ${environment}`);
  console.log(`process.env: `,process.env);
  console.log(`providerUrl: ${providerUrl}`);
  console.log('web3.eth.net ',web3.eth.net);
}
if (providerUrl.indexOf('127.0.0.1')>-1)
  web3.isReliable = true;

const reconnect = (wp = wsProvider)=> {
    console.log(`${time(d)}.${ms(d)}: Attempting to reconnect...`);
    wp = new Web3.providers.WebsocketProvider(providerUrl);

    wp.on('connect', function () {
      let d=new Date();
      console.log(`${time(d)}.${ms(d)}: WSS Reconnected`);
    });
    web3.setProvider(wp);
    wpUp = true;
}

wsProvider.on('error', e => {
  wpUp = false;
  console.log(`${time(d)}.${ms(d)}: WS Error`, e);
  reconnect(wsProvider);
  // retry!
});
wsProvider.on('end', e => {
  wpUp = false;
  console.log(`${time(new Date())}.${ms(d)}: WS closed`);
  reconnect(wsProvider);
});

if (authWeb3Type==='browser') {
  if (window.web3 && window.ethereum)
    authWeb3 = new Web3(window.ethereum)
  else {
    console.log(`Running in production, ${window.web3 ? '': 'lacking window.web3'} ${window.ethereum ? '': 'lacking window.ethereum'}`);
    authWeb3Type = 'local';  // leave it until error checking implemented in LiveTing
  }}
if (authWeb3Type==='local') {
  authWeb3 = web3;
  console.log(`Running in ${environment}`);
}

let NETWORK_ID;
let ProxyABI;
let ProxyAddress;
let ProxyInstance;
let ProxyInstanceForSend;
let PollABI;
let PollAddress;
let PollInstance;
let PollInstanceForSend;
let ValidatorABI;
let ValidatorAddress;
let ValidatorInstance;
let ValidatorInstanceForSend;

let IMPLEMENTATION_ABI;
let IMPLEMENTATION_INSTANCE;
let IMPLEMENTATION_INSTANCE_FOR_SEND;
let IMPLEMENTATION_ADDRESS;

let availableAccounts;
let OWN_ADDRESS;

let d;
const time = d=> d.toTimeString().slice(0,8);
const ms = d=> (d%1000).toFixed(0);

const wpIsUp = async (timeout)=> new Promise ((resolve, reject)=> {
  if (wpUp)
    resolve();
  let t2;
  let t = setInterval(()=>{
    if (wpUp) {
      clearTimeout(t2);
      clearInterval(t);
      resolve();
    }
  }, 199);
  if (timeout)
    t2= setTimeout(()=>{
      clearInterval(t);
      reject(`Gave up trying websocket after ${timeout}ms.`);
    })
})

export function connectToWeb3() {
  return new Promise( async (resolve, reject) => {
    let unImplementedAddress;
    let otherNetId;
    if (!web3.eth || !authWeb3.eth)
      reject (new Error('no web3 provider'));
    web3.eth.net.getId(async function (err, Id) {
      if (err) { console.log('err',err); reject(err); }
      if (web3!==authWeb3)
        await authWeb3.eth.net.getId((err, otherNetId)=> {
          if (err) { console.log('err',err); reject(err); }
          if (Id!==otherNetId)
            console.log(`Using network ${Id}for calls but network ${otherNetId} for sends. This going to end badly :/`);
          return otherNetId;
        });

      d = new Date();
      console.log(`${time(d)}.${ms(d)}: Network id is ${Id}, tx auth in: ${authWeb3Type}`);
      NETWORK_ID = Id;
      if (!TokenProxyArtifacts.networks[NETWORK_ID])
        console.log(`TokenProxyArtifacts does not have the current network! ${NETWORK_ID}`);
      if (!PollArtifacts.networks[NETWORK_ID])
        console.log(`PollArtifacts does not have the current network! ${NETWORK_ID}`);
      if (!ValidatorArtifacts.networks[NETWORK_ID])
        console.log(`ValidatorArtifacts does not have the current network! ${NETWORK_ID}`);

      ProxyAddress = TokenProxyArtifacts.networks[NETWORK_ID].address;
      PollAddress = PollArtifacts.networks[NETWORK_ID].address;
      ValidatorAddress = ValidatorArtifacts.networks[NETWORK_ID].address;

      ProxyABI = TokenProxyArtifacts.abi;
      PollABI = PollArtifacts.abi;
      ValidatorABI = ValidatorArtifacts.abi;

      ProxyInstance = new web3.eth.Contract(ProxyABI, ProxyAddress);
      PollInstance = new web3.eth.Contract(PollABI, ProxyAddress);
      ValidatorInstance = new web3.eth.Contract(ValidatorABI, ProxyAddress);
      if (web3 !== authWeb3) {
        ProxyInstanceForSend = new authWeb3.eth.Contract(ProxyABI, ProxyAddress);
        PollInstanceForSend = new authWeb3.eth.Contract(PollABI, ProxyAddress);
        ValidatorInstanceForSend = new authWeb3.eth.Contract(ValidatorABI, ProxyAddress);
      } else {
        ProxyInstanceForSend = ProxyInstance;
        PollInstanceForSend = PollInstance;
        ValidatorInstanceForSend = ValidatorInstance;
      }

      getImplementationAddress().then(async implementationAddress => {
        switch (implementationAddress) {
          case PollAddress:
            IMPLEMENTATION_ABI = PollABI;
            IMPLEMENTATION_ADDRESS = PollAddress;
            IMPLEMENTATION_INSTANCE = PollInstance;
            IMPLEMENTATION_INSTANCE_FOR_SEND = PollInstanceForSend;
            unImplementedAddress = ValidatorAddress;
            break;
          case ValidatorAddress:
            IMPLEMENTATION_ABI = ValidatorABI;
            IMPLEMENTATION_ADDRESS = ValidatorAddress;
            IMPLEMENTATION_INSTANCE = ValidatorInstance;
            IMPLEMENTATION_INSTANCE_FOR_SEND = ValidatorInstanceForSend;
            unImplementedAddress = PollAddress;
            break;
          default:
            break;
          }

          awaitAccess = awaitAccess
            || ( authWeb3Type==='local' && Promise.resolve() )    // skip awaiting metamask if authWeb3Type==='local'
            || window.ethereum.request && window.ethereum.request({ method: 'eth_requestAccounts' })  // else try new form of metamask enable request
            || window.ethereum.enable() ;                                                 // or the older form

          awaitAccess
            .then((promiseResponse)=>{
              if (promiseResponse)
                console.log('Works without this resolve value - this should only resolve to something if metamask is enabled and is new. Heres the resolve value:', promiseResponse);
              authWeb3.eth.getAccounts((err, accounts) => {
                awaitAccess = null;
                if (err) reject(err);
                availableAccounts = accounts;
                OWN_ADDRESS = accounts[0];

                resolve({
                  IMPLEMENTATION_ADDRESS,
                  OWN_ADDRESS,
                  availableAccounts,
                  unImplementedAddress,
                  PollAddress,
                  ValidatorAddress
                });
              })
            });
      });
    });
  });
}


export function getImplementationAddress() {
    // returns the address of the latest version of the contract
    return new Promise((resolve, reject) => {
        ProxyInstance.methods.implementation().call()
          .then(implementationAddress => {
            resolve(implementationAddress)
          })
          .catch(err => {
            console.log('There was an error at first access of the contract.');
            console.log('This would happen if you are trying to access the wrong blockchain.');
            console.log('Try migrating the chain again, or copying over the artifacts from the chain you need to use.');
            console.log('the error was:', err);
            reject(err)
          })
    })
}


export async function updateKnownPolls( options ) {
    // returns the list of events that are in the latest version of the contract
    // const { setWatchers } = options;
    console.log(IMPLEMENTATION_ABI);
    console.log(IMPLEMENTATION_INSTANCE.events);

    return ;
}


export async function getImplementationEvents( pollUrl, options={ setWatchers:false }, eventListeners={} ) {
  // returns the list of events that are in the latest version of the contract
  const filterByPoll = (pollUrl, watcher) => (result, eventName)=> {
    const eventPoll = result.returnValues.poll || result.returnValues._poll;
    if ((pollUrl && pollUrl.length>0) && (eventPoll && eventPoll.length) && pollUrl != eventPoll) {
      console.log(`${eventName} event ignored:`, result.returnValues);
      return
    } else
      watcher(result, eventName);
  }

  let rv = [];
  console.log('listeners:',eventListeners);
  const { setWatchers } = options;
  console.log(IMPLEMENTATION_ABI);
  console.log(IMPLEMENTATION_INSTANCE.events);
  IMPLEMENTATION_ABI.forEach(ele => {
    if (ele.type === "event") {
      let objectToBeAppended = {};
      objectToBeAppended["eventName"] = ele["name"];
      let argsObject = [];

      ele.inputs.forEach(input => {
        argsObject.push(`${input.name} (${input.type})`);
      });
      if (setWatchers){
        setEventWatcher( ele["name"], filterByPoll(pollUrl, eventListeners[ele["name"]]) );
      }
      objectToBeAppended["signature"] = ele["signature"];

      rv.push(objectToBeAppended);
    }
  });
  return rv;
}

const withErrLog = (eventName, actionFn)=> {
  const errFn= actionFn.errFn || (err=>{
    if (err.message!=='CONNECTION ERROR: The connection closed unexpectedly')
      console.log(time(new Date()),err, err.stack);
  });
  return (err, result)=>
    err
      ? errFn(err)
      : actionFn(result, eventName)
}

export async function setEventWatcher(event, action) {
  action = withErrLog (event, action || ((result, eventName)=>{ console.log(eventName, result) }) )

    // action = action || ((err, result)=> {
    //   if (err) {
    //     console.log(err)
    //     return;
    //   }
    //
    //   // console.log(result.args._value);
    //   // console.log(result);
    //   console.log(`Event ${event} returning:`,result.returnValues);
    // });
    // // console.log(`Will set watch on ${event} with ${action.toString()}`);
    // // console.log(`IMPLEMENTATION_INSTANCE.events[${event}]()`,IMPLEMENTATION_INSTANCE.events[event]);
    IMPLEMENTATION_INSTANCE.events[event](action);
};

export async function getImplementationFunctions() {
    // returns the list of functions that are in the latest version of the contract
    let rv = [];
    IMPLEMENTATION_ABI.forEach(ele => {
  console.log(ele.type);
        if (ele.type === "function") {
            // console.log(`Found function`, ele);
            let objectToBeAppended = {};
            objectToBeAppended["funcName"] = ele["name"];
            let argsObject = [];

            ele.inputs.forEach(input => {
                argsObject.push(`${input.name} (${input.type})`);
            });
            objectToBeAppended.outputs = ele.outputs.map(e=>e.type);

            objectToBeAppended["mutates"] = ele.stateMutability === "nonpayable" || ele.stateMutability === "payable";
            objectToBeAppended["returns"] = !!ele.outputs.length;
            objectToBeAppended["args"] = argsObject;

            rv.push(objectToBeAppended);
        }
    });
    return rv;
}

function checkForTokenHandlingArgument(arg) {
    if (arg === "amount" || arg === "value") return true;
    else return arg.substr(0, 1) === "amount" || arg.substr(0, 1) === "value";
}

function checkWithABI(currentFunc, functionName, args, resolve, reject) {
    let rv = [];
  console.log(currentFunc.inputs);
  console.log(functionName, args);
    currentFunc.inputs.forEach(input => {
        if (typeof args[input.name]==='number')
          args[input.name] = args[input.name].toString();
        console.log(input.name, args, args[input.name]);
        if (!args[input.name]) {
            console.log(`Will reject from checkWithABI: ${input.name} not found in ${functionName}'s args`,args);
            console.log(` ${input.name}='${args[input.name]}' of type ${typeof args[input.name]}`);
            reject(new Error("INVALID ARGUMENTS: Invalid Number of arguments"));
        }
        let callValue = args[input.name];
        let inputType = input.type;
        if (inputType.substr(0, 4) === "uint" || inputType.substr(0, 3) === "int") {
            let notNum = isNaN(callValue);
            if (notNum || callValue.length === 0)
                reject(
                    new Error(
                        `INVALID ARGUMENTS: Only number can be passed in ${input.name}`
                    )
                );
            if (checkForTokenHandlingArgument(input.name)) {
                let val = callValue;
                console.log("checked value", val);
                rv.push(val);
            } else rv.push(parseInt(callValue));
        } else if (inputType === "address") {
            if (
                callValue.substr(0, 2) !== "0x" ||
                callValue.length !== 42 ||
                callValue.length === 0
            ) {
                reject(
                    new Error(
                        `INVALID ARGUMENTS: Only ethereum address can be passed in ${input.name}`
                    )
                );
            }

            rv.push(callValue);
        } else if ((inputType === "string" || inputType.substr(0, 5) === "bytes") && !inputType.endsWith(']')) {
            // Nothing to do here bz everything is acceptable
            rv.push(callValue);
        } else if (inputType.endsWith(']')) {
            console.log('Will parse:',callValue);
            rv.push( Array.isArray(callValue)
                      ? callValue
                      : JSON.parse(callValue)   //Hacky! will work only for exact format ["v4l1dD4t4",0xetc], will not sanity check contents, etc..
            );
          }
    });
    console.log(`resolving with ${rv.length} RVs for ${currentFunc.outputs.length} outputs.`);
    if (rv.length!==currentFunc.outputs.length)
      console.log(rv);
    resolve({rv, outputs: currentFunc.outputs });
}


async function checkFunctionFormatting(functionName, args) {
    return new Promise((resolve, reject) => {
        let found = ProxyABI.find(element => {
            return element.name === functionName;
        });
        if (found)
          console.log(`Ooh - found ${functionName} in the Proxy without going to Impoementation! :`, found);
        // Checks Proxy before Implementation!
        if (found) {
            // Function present in Proxy Contract
            checkWithABI(found, functionName, args, resolve, reject);
        } else {
            let nowFound = IMPLEMENTATION_ABI.find(element => {
                return element.name === functionName;
            });
            console.log(functionName, nowFound);
            if (!nowFound)
              console.log(`${functionName} was not found. Did you rename it?`);
            // Function present in Implementation Contract
            console.log('checkWithABI', nowFound, functionName, args);
            checkWithABI(nowFound, functionName, args, resolve, reject);
        }
    });
}

function unpackRVs (result, outputs) {
  // console.log(typeof result, result);
    outputs = outputs.forEach ((output,idx)=> {
      // console.log('output',output);
      if (output && (output["type"].substr(0, 4) === "uint" || output["type"].substr(0, 3) === "int")) {
        if (typeof result==="object")
          result[idx] = (parseInt(result[idx].valueOf()));
        else if (typeof result==="object")        // why is this unreachable code here?
          result = (parseInt(result[idx].valueOf()));
        // handleExponentialNumber(result[idx].valueOf(), resolve);
        if (output && output["type"].substr(0, 5) === "tuple")
            result[idx] = `Can't yet handle returned tuples, sorry!`;
    }});
    console.log(typeof result, result);
    return result;
}

// works for web3 1.28, sol 0.5.7
export function getFromStorage(storageName, idx) {
  return new Promise((resolve, reject) => {
    const args= (idx===undefined ? undefined : {'':idx})

    console.log('getFromStorage',storageName, idx);
    console.log(('args',args));
    console.log('Warning: getFromStorage may have a bug :/');

    checkFunctionFormatting(storageName, args )
      .then(({rv, outputs}) => {
        // Look at this ugliness! Apparently fn(undefined) != fn() :/
        const getter = (args===undefined)
          ? IMPLEMENTATION_INSTANCE.methods[storageName]()
          : IMPLEMENTATION_INSTANCE.methods[storageName](args) ;

        // console.log(`Read to: ${storageName} of`,IMPLEMENTATION_INSTANCE);
        getter
          .call(args)
          .then(result => {
              unpackRVs (result, outputs);
              resolve(result);
          })
          .catch(err=>{console.log(err); reject(err);});
      });
  });
}

export function callTransaction(functionName, args) {
    /* eslint-disable no-loop-func */
    return new Promise((resolve, reject) => {
      checkFunctionFormatting(functionName, args)
        .then(async ({rv, outputs}) => {
          let attempt;
          console.log(`Call to (IMPLEMENTATION_INSTANCE):`,IMPLEMENTATION_INSTANCE,functionName,args,rv);

          let i=wsRetries;
          while (i--) {
            console.log(web3.isReliable);
            console.log(await wpIsUp());
            if (!web3.isReliable)
              await wpIsUp();
            attempt = IMPLEMENTATION_INSTANCE.methods[functionName](...rv)
              .call({from: OWN_ADDRESS});
            attempt
              .then(result => {
                console.log(functionName,': chain responded:', result);
                unpackRVs (result, outputs);
                i=0;
                resolve(result);
              })
              .catch(err=> {
                if (err.message==='CONNECTION ERROR: The connection closed unexpectedly')
                  reconnect();
                console.log(`${functionName} fail:`,err); reject(err)
              });
            }
          })
        .catch(err => {
            reject(err);
        });
    });
    /* eslint-enable */
}

const logGasEstimate = (err, functionName, args, gasAmount) => {
  if (err) console.log('Gas error:',err);
  console.log(`${functionName}(${args.join(', ')})- expected gas: ${gasAmount}`);
}

export function sendTransaction(functionName, args) {
    return new Promise((resolve, reject) => {
        checkFunctionFormatting(functionName, args)
            .then(({rv, outputs}) => {
                let gas;
                console.log(`Send to (${functionName}):`,IMPLEMENTATION_INSTANCE_FOR_SEND);
                console.log('got back from checkFF ready to send:',{rv, outputs});
                IMPLEMENTATION_INSTANCE_FOR_SEND.methods[functionName](...rv)
                    .estimateGas({from: OWN_ADDRESS})
                    .then (estimatedGas=>{
                      gas = estimatedGas;
                      logGasEstimate(null, functionName, rv, gas);
                      return gas
                    })
                    .then (async gas=>{
                      if ((authWeb3Type!=='browser') && !authWeb3.isReliable)
                        {} // await authWpIsUp())
                      IMPLEMENTATION_INSTANCE_FOR_SEND.methods[functionName](...rv)
                        .send({from: OWN_ADDRESS, gas})
                        .then(result => {
                          console.log(typeof result, result);
                          resolve(result);
                        })
                    })
                    .catch(e=>{console.log(`${functionName} fail:`,e); reject(e)});
            })
            .catch(err => {
                console.log(`Bad format for ${functionName}`, err);
                reject(err);
            });
    });
}

// export function sendTransaction(functionName, args) {
//     return new Promise((resolve, reject) => {
//       checkFunctionFormatting(functionName, args)
//         .then(({rv, outputs}) => {
//           console.log(`Send to (${functionName}):`,IMPLEMENTATION_INSTANCE_FOR_SEND);
//           console.log('got back from checkFF ready to send:',{rv, outputs});
//           IMPLEMENTATION_INSTANCE_FOR_SEND.methods[functionName](...rv)
//             .send({from: OWN_ADDRESS})
//             .then(result => {
//               console.log(typeof result, result);
//               resolve(result);
//             })
//             .catch(e=>{console.log(`${functionName} fail:`,e);reject(e)});
//         })
//         .catch(err => {
//           console.log(`Bad format for ${functionName}`, err);
//           reject(err);
//         });
//     });
// }

export function switchTo(address) {
    return new Promise((resolve, reject) => {
      console.log('Got to A');
        ProxyInstance.methods.upgradeTo(address).send({from: OWN_ADDRESS}).then(result => {
          console.log('Got to B');
          resolve(result)

        })

    })
}

// export const setOwnAddy= address=> {
//   OWN_ADDRESS = address;
// }
//
// export const currentOwnAddy= ()=> new Promise( resolve=>{
//   if (OWN_ADDRESS)
//     resolve(OWN_ADDRESS);
//   setTimeout(()=>{
//     resolve( currentOwnAddy(OWN_ADDRESS), 1000 )
//   })
// })

export const getDeets = ()=> ({
  NETWORK_ID, OWN_ADDRESS,
  ProxyAddress, PollAddress, ValidatorAddress,
  ProxyABI, PollABI, ValidatorABI,
  ProxyInstance, PollInstance, ValidatorInstance,
  ProxyInstanceForSend, PollInstanceForSend, ValidatorInstanceForSend,
  IMPLEMENTATION_ABI, IMPLEMENTATION_ADDRESS, IMPLEMENTATION_INSTANCE, IMPLEMENTATION_INSTANCE_FOR_SEND
})
