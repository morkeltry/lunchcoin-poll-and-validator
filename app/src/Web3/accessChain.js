
import Web3, { ConnectionError } from "web3";
import  { useGlobal } from "reactn";
import TokenProxyArtifacts from "../contracts/TokenProxy.json";
import PollArtifacts from "../contracts/PollReference.json";
import ValidatorArtifacts from "../contracts/MutualAgreement.json";

const env = require('env2')('./.env');
const envVars = Object.keys(process.env);
if (envVars.length>2)
console.log(envVars);


let providerUrl = {
  development : 'ws://127.0.0.1:8545',
  production: 'wss://mainnet-ws.thundercore.com/'
}[process.env.REACT_APP_NODE_ENV || 'production'];
let web3;

// NB Drizzle Requires 'ws://' not anything else
// if (providerUrl.startsWith('ws'))
//   web3 = new Web3(new Web3.providers.HttpProvider(providerUrl))
// else
  web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));
if (!web3.eth.net)
  console.log(`Did not get web3.eth.net from ${providerUrl}. Maybe check the port number?`);
if (process.env.REACT_APP_NODE_ENV !== 'production'){
  console.log(`Running in ${process.env.REACT_APP_NODE_ENV}`);
  console.log(`process.env: `,process.env);
  if (web3.eth)
    console.log('but web3.eth.net=',web3.eth.net);
}

let NETWORK_ID;
let ProxyABI;
let ProxyAddress;
let ProxyInstance;
let PollABI;
let PollAddress;
let PollInstance;
let ValidatorABI;
let ValidatorAddress;
let ValidatorInstance;

let IMPLEMENTATION_ABI;
let IMPLEMENTATION_INSTANCE;
let IMPLEMENTATION_ADDRESS;

let OWN_ADDRESS;
let availableAccounts;

export function connectToWeb3() {
    // connects to web3 with the latest version of the contract
    return new Promise((resolve, reject) => {
    let unImplementedAddress;
        web3.eth.net.getId(function (err, Id) {
            if (err) reject(err);
        console.log('err',err);
        console.log('Id',Id);
            NETWORK_ID = Id;
            console.log(`NETWORK_ID = ${NETWORK_ID}`);
            if (!TokenProxyArtifacts.networks[NETWORK_ID])
              console.log(`TokenProxyArtifacts does not have the current network! ${NETWORK_ID}`);
            // if (!TokenV0Artifacts.networks[NETWORK_ID])
            //   console.log(`TokenV0Artifacts does not have the current network! ${NETWORK_ID}`);
            // if (!TokenV1Artifacts.networks[NETWORK_ID])
            //   console.log(`TokenV1Artifacts does not have the current network! ${NETWORK_ID}`);
            if (!PollArtifacts.networks[NETWORK_ID])
              console.log(`PollArtifacts does not have the current network! ${NETWORK_ID}`);
            if (!ValidatorArtifacts.networks[NETWORK_ID])
              console.log(`ValidatorArtifacts does not have the current network! ${NETWORK_ID}`);
            // console.log(TokenProxyArtifacts);
            // console.log(Object.keys(TokenProxyArtifacts.networks));
            // console.log(TokenV0Artifacts);
            // console.log(Object.keys(TokenV0Artifacts.networks));
            // console.log(TokenV1Artifacts);
            // console.log(Object.keys(TokenV1Artifacts.networks));
            // console.log(PollArtifacts);
            // console.log(Object.keys(PollArtifacts.networks));
            // console.log(ValidatorArtifacts);
            // console.log(Object.keys(ValidatorArtifacts.networks));

            ProxyAddress = TokenProxyArtifacts.networks[NETWORK_ID].address;
            PollAddress = PollArtifacts.networks[NETWORK_ID].address;
            ValidatorAddress = ValidatorArtifacts.networks[NETWORK_ID].address;

            ProxyABI = TokenProxyArtifacts.abi;
            PollABI = PollArtifacts.abi;
            ValidatorABI = ValidatorArtifacts.abi;

            ProxyInstance = new web3.eth.Contract(ProxyABI, ProxyAddress);
            PollInstance = new web3.eth.Contract(PollABI, ProxyAddress);
            ValidatorInstance = new web3.eth.Contract(ValidatorABI, ProxyAddress);
            getImplementationAddress().then(implementationAddress => {
                switch (implementationAddress) {
                    case PollAddress:
                        IMPLEMENTATION_ABI = PollABI;
                        IMPLEMENTATION_ADDRESS = PollAddress;
                        IMPLEMENTATION_INSTANCE = PollInstance;
                        unImplementedAddress = ValidatorAddress;
                        break;
                    case ValidatorAddress:
                        IMPLEMENTATION_ABI = ValidatorABI;
                        IMPLEMENTATION_ADDRESS = ValidatorAddress;
                        IMPLEMENTATION_INSTANCE = ValidatorInstance;
                        unImplementedAddress = PollAddress;
                        break;
                    default:
                        break;
                }
                web3.eth.getAccounts((err, accounts) => {
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


export async function getImplementationEvents( options={ setWatchers:false }, eventListeners={} ) {
    // returns the list of events that are in the latest version of the contract
    let rv = [];
    console.log(options);
    console.log(eventListeners);
    const { setWatchers } = options;
    console.log(IMPLEMENTATION_ABI);
    console.log(IMPLEMENTATION_INSTANCE.events);
    IMPLEMENTATION_ABI.forEach(ele => {
        if (ele.type === "event") {
            console.log(`Found event`, ele);
            let objectToBeAppended = {};
            objectToBeAppended["eventName"] = ele["name"];
            let argsObject = [];

            ele.inputs.forEach(input => {
                argsObject.push(`${input.name} (${input.type})`);
            });
            if (setWatchers){
              setEventWatcher(ele["name"], eventListeners[ele["name"]]);
            }
            objectToBeAppended["signature"] = ele["signature"];

            rv.push(objectToBeAppended);
        }
    });
    return rv;
}

const withErrLog = (eventName, actionFn)=> {
  const errFn= actionFn.errFn || (err=>{ console.log(err) }) ;
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
        console.log(input.name, args, args[input.name]);
        if (!args[input.name]) {
            console.log(`Will reject from checkWithABI: ${input.name} not found in ${functionName}'s args`,args);
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
        console.log(functionName, found);
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
      if (output && output["type"].substr(0, 4) === "uint") {
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
    return new Promise((resolve, reject) => {
        checkFunctionFormatting(functionName, args)
            .then(({rv, outputs}) => {
                console.log(`Call to:`,IMPLEMENTATION_INSTANCE,functionName,args,rv);
                IMPLEMENTATION_INSTANCE.methods[functionName](...rv)
                    .call({from: OWN_ADDRESS})
                    .then(result => {
                        console.log(functionName,': chain responded:', result);
                        unpackRVs (result, outputs);
                        resolve(result);
                    })
                    .catch(e=>{console.log(`${functionName} fail:`,e);reject(e)});

            })
            .catch(err => {
                reject(err);
            });
    });
}

export function sendTransaction(functionName, args) {
    return new Promise((resolve, reject) => {
        checkFunctionFormatting(functionName, args)
            .then(({rv, outputs}) => {
                console.log(`Send to (${functionName}):`,IMPLEMENTATION_INSTANCE);
                console.log('got back from checkFF ready to send:',{rv, outputs});
                IMPLEMENTATION_INSTANCE.methods[functionName](...rv)
                    .send({from: OWN_ADDRESS})
                    .then(result => {
                        console.log(typeof result, result);
                        resolve(result);
                    })
                    .catch(e=>{console.log(`${functionName} fail:`,e); reject(e)});
            })
            .catch(err => {
                console.log(`Bad format for ${functionName}`, err);
                reject(err);
            });
    });
}

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
  IMPLEMENTATION_ABI, IMPLEMENTATION_ADDRESS, IMPLEMENTATION_INSTANCE,
})
