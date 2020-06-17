export const globalDefaults = {
  _poll : 'doodle.com/poll/h7phtw5u2thhz9k4', poll : 'doodle.com/poll/h7phtw5u2thhz9k4',
  _vt : 1, vt : 1,
  _newProof : '[]',
  _fnName : 'serialiseStakers'

};

const twelveZeroes = "000000000000000000000000";

export const byFuncDefaults = {
  set : {
    _fnName : 'serialiseStakers',
    _stakerOrZero : '0x0000000000000000000000000000000000000000',
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
  pollData : {
    '' : 'doodle.com/poll/h7phtw5u2thhz9k4'
  },
  addStaker : {
    '' : ''
  },
  checkIn : {
    _newProof : '[]'
  },
  addProof : {
    _newProof : '[]'
  },
  addProofSelf : {
    _newProof : '[]'
  },
  setRep : {
    _rep : 4000
  },
  addStake : {
    _rep : 1500,
    _venueContribution : 15000,
    _venueContributionFor : '0xaB4367Bd45a8812996B0d34a8141326235FBAE87'
  },
  getProofProperUsingStaker : {
    _fnName : 'serialiseProofs'
  },
};

const dontShow = {

};
[
  'doEmit', 'setFlag', 'setCheckedInNoStaker', 'flag', 'getFlag', 'getProofIgnoringStaker', ' deserialiseStakers',
  'set',  'get', 'setByHash',  'getByHash', 'getProofEmitHashesOnlyWithStaker',
  'validatorNames', 'validators', 'setString', 'justSetStuff',
  'serialiseStakers', 'serialiseProofs', 'deserialiseStakers',
  'proofType', 'bytesToAddress', 'toString', 'splitToAddresses',
  'bytes32ToBytes', 'bytesToBytes32', 'bytes32ToString', 'bytes32ArrayToString',
  'string32ToBytes32', 'stringToBytes32Array', 'bytesSplit32',
  'bytesSplit4', 'bytesToBytes4',
  'encodeFunctionName', 'storeResult',
  'xcValidate', 'crossContractCall', 'crossContractValidateCall', 'callValidator_MututalAgreement'
].forEach (name => {dontShow[name]=true;} );

export const clearAfterSubmit = {
  checkIn : [
    "_newMember", "newMember"
  ],
}

export const doNotShowFuncs = dontShow;