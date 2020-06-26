export const globalDefaults = {
  _poll : 'doodle.com/poll/r9rb35fiibvs3aa5', poll : 'doodle.com/poll/r9rb35fiibvs3aa5',
  _vt : 1, vt : 1,
  _newProof : '[]',
  _mapName : 'staker',
  _staker: 'OWN_ADDRESS', staker: 'OWN_ADDRESS',
  _stakerOrZero: 'OWN_ADDRESS', stakerOrZero: 'OWN_ADDRESS',
  _impersonatedStaker: 'OWN_ADDRESS', impersonatedStaker: 'OWN_ADDRESS',
  _to: 'OWN_ADDRESS', to: 'OWN_ADDRESS',
  _by: 'OWN_ADDRESS', by: 'OWN_ADDRESS',

};

const twelveZeroes = "000000000000000000000000";

export const byFuncDefaults = {
  set : {
    _mapName : 'staker',
    _stakerOrZero : '0x0000000000000000000000000000000000000000',
    _data : '[""]',
    data : '[""]',
  },
  add : {
    _mapName : 'serialiseProofs',
    _newMember : "0x370164874A0B14470470D04945513E4F4E66478F", newMember : "0x370164874A0B14470470D04945513E4F4E66478F",
  },
  validate : {
    _pollContract : '0xaB4367Bd45a8812996B0d34a8141326235FBAE87',
    _reveal : '0x71776572747975696f706173646667686a6b6c7a786376626e6d313233343536',
  },
  retrieve : {
    _mapName : 'proof',
  },
  pollData : {
    '' : 'doodle.com/poll/r9rb35fiibvs3aa5'
  },
  addStaker : {
    '' : ''
  },
  checkIn : {
    _newProof : ''
  },
  addProof : {
    _newProof : '[""]'
  },
  addProofSelf : {
    _newProof : '[""]'
  },
  setRep : {
    _rep : 4000
  },
  addStake : {
    _rep : 1500,
    _venueContribution : 15000,
    _venueContributionFor : ''
  },
  getProofUsingStaker : {
    _mapName : 'proof',
    _staker : ''
  },
  getStakersProof : {
    _staker : ''
  },
   totalRepStaked : {
    _staker : ''
  },
    totalVenueContribs : {
    _staker : ''
  },
};

const dontShow = {

};
[
  'doEmit', 'setFlag', 'setCheckedInNoStaker', 'flag', 'getFlag', 'getProofIgnoringStaker', ' deserialiseStakers',
  // may use these for testing, but check caveats!!
  'set',  'get', 'setByHash',  'getByHash', // 'getProofEmitHashesOnlyWithStaker',
  // not working - use addProofs instead
  'checkIn', 'setCheckedInWithStaker',
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
