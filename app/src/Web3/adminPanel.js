import Web3 from "web3";
import TokenProxyArtifacts from "../contracts/TokenProxy.json";
import TokenV0Artifacts from "../contracts/Token_V0.json";
import TokenV1Artifacts from "../contracts/Token_V1.json";
import PollArtifacts from "../contracts/PollReference.json";
import ValidatorArtifacts from "../contracts/MutualAgreement.json";

let providerUrl = "ws://127.0.0.1:8545";
let web3;

// NB Drizzle Requires 'ws://' not anything else
// if (providerUrl.startsWith('ws'))
//   web3 = new Web3(new Web3.providers.HttpProvider(providerUrl))
// else
  web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));
if (!web3.eth.net)
  console.log(`Did not get web3.eth.net from ${providerUrl}. Maybe check the port number?`);

let NETWORK_ID;
let TokenV0ABI;
let TokenV1ABI;
let TokenV0Address;
let TokenV1Address;
let ProxyABI;
let ProxyAddress;
let ProxyInstance;
let TokenV0Instance;
let TokenV1Instance;
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

export function connectToWeb3() {
    // connects to web3 with the latest version of the contract
    return new Promise((resolve, reject) => {
    let unImplementedAddress;
        web3.eth.net.getId(function (err, Id) {
            if (err) reject(err);
            NETWORK_ID = Id;
            console.log(`NETWORK_ID = ${NETWORK_ID}`);
            if (!TokenProxyArtifacts.networks[NETWORK_ID])
              console.log(`TokenProxyArtifacts does not have the current network! ${NETWORK_ID}`);
            if (!TokenV0Artifacts.networks[NETWORK_ID])
              console.log(`TokenV0Artifacts does not have the current network! ${NETWORK_ID}`);
            if (!TokenV1Artifacts.networks[NETWORK_ID])
              console.log(`TokenV1Artifacts does not have the current network! ${NETWORK_ID}`);
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
            TokenV0Address = TokenV0Artifacts.networks[NETWORK_ID].address;
            TokenV1Address = TokenV1Artifacts.networks[NETWORK_ID].address;
            PollAddress = PollArtifacts.networks[NETWORK_ID].address;
            ValidatorAddress = ValidatorArtifacts.networks[NETWORK_ID].address;

            ProxyABI = TokenProxyArtifacts.abi;
            TokenV0ABI = TokenV0Artifacts.abi;
            TokenV1ABI = TokenV1Artifacts.abi;
            PollABI = PollArtifacts.abi;
            ValidatorABI = ValidatorArtifacts.abi;

            ProxyInstance = new web3.eth.Contract(ProxyABI, ProxyAddress);
            TokenV0Instance = new web3.eth.Contract(TokenV0ABI, ProxyAddress);
            TokenV1Instance = new web3.eth.Contract(TokenV1ABI, ProxyAddress);
            PollInstance = new web3.eth.Contract(PollABI, ProxyAddress);
            ValidatorInstance = new web3.eth.Contract(ValidatorABI, ProxyAddress);
            getImplementationAddress().then(implementationAddress => {
                switch (implementationAddress) {
                    case TokenV0Address:
                        IMPLEMENTATION_ABI = TokenV0ABI;
                        IMPLEMENTATION_ADDRESS = TokenV0Address;
                        IMPLEMENTATION_INSTANCE = TokenV0Instance;
                        unImplementedAddress = TokenV1Address;
                        break;
                    case TokenV1Address:
                        IMPLEMENTATION_ABI = TokenV1ABI;
                        IMPLEMENTATION_ADDRESS = TokenV1Address;
                        IMPLEMENTATION_INSTANCE = TokenV1Instance;
                        unImplementedAddress = TokenV0Address;
                        break;
                    case PollAddress:
                        IMPLEMENTATION_ABI = PollABI;
                        IMPLEMENTATION_ADDRESS = PollAddress;
                        IMPLEMENTATION_INSTANCE = PollInstance;
                        unImplementedAddress = TokenV0Address;
                        break;
                    case ValidatorAddress:
                        IMPLEMENTATION_ABI = ValidatorABI;
                        IMPLEMENTATION_ADDRESS = ValidatorAddress;
                        IMPLEMENTATION_INSTANCE = ValidatorInstance;
                        unImplementedAddress = TokenV0Address;
                        break;
                    default:
                        break;

                }
                web3.eth.getAccounts((err, accounts) => {
                    if (err) reject(err);
                    OWN_ADDRESS = accounts[0];

                    resolve({
                      IMPLEMENTATION_ADDRESS,
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
        ProxyInstance.methods.implementation().call().then(implementationAddress => {
            resolve(implementationAddress)
        })
    })
}




export async function getImplementationEvents( options={ setWatchers:false } ) {
    // returns the list of events that are in the latest version of the contract
    let rv = [];
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
            if (setWatchers)
              setEventWatcher(ele["name"]);

            objectToBeAppended["signature"] = ele["signature"];

            rv.push(objectToBeAppended);
        }
    });
    return rv;
}

export async function setEventWatcher(event, action) {
    action = action || ((err, result)=> {
      if (err) {
        console.log(err)
        return;
      }
      // console.log(result.args._value);
      // console.log(result);
      console.log('Event returning:',result.returnValues);
    });
    console.log(`Will set watch on ${event} with ${action.toString()}`);
    console.log(`IMPLEMENTATION_INSTANCE.events[${event}]()`,IMPLEMENTATION_INSTANCE.events[event]);
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
            objectToBeAppended["args"] = argsObject;

            rv.push(objectToBeAppended);
        }
    });
    return rv;
}

async function checkFunctionFormatting(functionName, args) {
    return new Promise((resolve, reject) => {
        let found = ProxyABI.find(element => {
            return element.name === functionName;
        });
        if (found) {
            // Function present in Proxy Contract
            checkWithABI(found, functionName, args, resolve, reject);
        } else {
            let nowFound = IMPLEMENTATION_ABI.find(element => {
                return element.name === functionName;
            });
            // Function present in Implementation Contract
            checkWithABI(nowFound, functionName, args, resolve, reject);
        }
    });
}

function checkForTokenHandlingArgument(arg) {
    if (arg === "amount" || arg === "value") return true;
    else return arg.substr(0, 1) === "amount" || arg.substr(0, 1) === "value";
}

function checkWithABI(currentFunc, functionName, args, resolve, reject) {
    let rv = [];
    currentFunc.inputs.forEach(input => {
        if (!args[input.name])
            reject(new Error("INVALID ARGUMENTS: Invalid Number of arguments"));
        let callValue = args[input.name];
        let inputType = input.type;
        if (inputType.substr(0, 4) === "uint") {
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
        } else if (inputType.endsWith(']'))
            rv.push(JSON.parse(callValue));   //Hacky! will work only for exact format ["v4l1dD4t4",0xetc], will not sanity check contents, etc..
    });
    resolve({rv, outputs: currentFunc.outputs });
}


export function callTransaction(functionName, args) {
    return new Promise((resolve, reject) => {
        checkFunctionFormatting(functionName, args)
            .then(({rv, outputs}) => {

                console.log(`Call to:`,IMPLEMENTATION_INSTANCE,args);
                IMPLEMENTATION_INSTANCE.methods[functionName](...rv)
                    .call({from: OWN_ADDRESS})
                    .then(result => {
                      console.log(typeof result, result);
                        outputs = outputs.forEach ((output,idx)=> {
                          console.log('output',output);
                          if (output && output["type"].substr(0, 4) === "uint") {
                            if (typeof result==="object")
                              result[idx] = (parseInt(result[idx].valueOf()));
                            else if (typeof result==="object")
                              result = (parseInt(result[idx].valueOf()));
                            // handleExponentialNumber(result[idx].valueOf(), resolve);
                        }});
                        resolve(result);
                    })
                    .catch(reject);

            })
            .catch(err => {
                reject(err);
            });
    });
}

export function sendTransaction(functionName, args) {
    return new Promise((resolve, reject) => {
        checkFunctionFormatting(functionName, args)
            .then(({rv, output}) => {
                console.log(`Send to:`,IMPLEMENTATION_INSTANCE);
                console.log('got:',{rv, output});
                IMPLEMENTATION_INSTANCE.methods[functionName](...rv)
                    .send({from: OWN_ADDRESS})
                    .then(result => {
                        console.log(typeof result, result);
                        resolve(result);
                    })
                    .catch(reject);
            })
            .catch(err => {
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
