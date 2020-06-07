export const globalDefaults = {
  _poll : 'doodle.com/poll/h7phtw5u2thhz9k4', poll : 'doodle.com/poll/h7phtw5u2thhz9k4',
  _vt : 1, vt : 1,

};

const twelveZeroes = "000000000000000000000000";

export const byFuncDefaults = {
  set : {
    _fnName : 'serialiseStakers',
    _data : '["0xaB4367Bd45a8812996B0d34a8141326235FBAE87000000000000000000000000","0x370164874A0B14470470D04945513E4F4E66478F000000000000000000000000"]',
    data : '["0xaB4367Bd45a8812996B0d34a8141326235FBAE87000000000000000000000000","0x370164874A0B14470470D04945513E4F4E66478F000000000000000000000000"]',
  },
  add : {
    _fnName : 'serialiseProofs',
    _newMember : "0x370164874A0B14470470D04945513E4F4E66478F", newMember : "0x370164874A0B14470470D04945513E4F4E66478F",
  },
  validate : {
    _pollContract : '0xaB4367Bd45a8812996B0d34a8141326235FBAE87',
    _reveal : '0x71776572747975696f706173646667686a6b6c7a786376626e6d313233343536',
  },
  retrieve : {
    _fnName : 'serialiseProofs',
  },
};

const dontShow = {

};
[
  'validatorNames', 'validators', 'setString', 'justSetStuff',
'serialiseStakers', 'serialiseProofs', '', '',
'proofType', 'bytesToAddress', 'toString', 'splitToAddresses',
'bytes32ToBytes', 'bytesToBytes32', 'bytes32ToString', 'bytes32ArrayToString',
'string32ToBytes32', 'stringToBytes32Array', 'bytesSplit32',
'bytesSplit4', 'bytesToBytes4',
'encodeFunctionName', 'storeResult',
'xcValidate', 'crossContractCall', 'crossContractValidateCall', 'callValidator_MututalAgreement'
].forEach (name => {dontShow[name]=true;} );

console.log(dontShow);
console.log(dontShow['set']);
export const doNotShowFuncs = dontShow;
