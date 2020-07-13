pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "./strings.sol";
import "./stringCasting.sol";
// import "./BytesLib.sol";
import "./SafeMath.sol";

/* Lunchcoin validator contract - mutual agreement */
contract MutualAgreement {
    // Common storage structure for ALL contacts using this storage.
    // _, __, __ , etc are unused in this contract, but must remain to occupy their slots.

    address owner;  // is set by TokenStorage.. but retain types and order.

    struct TimeRange {
      uint start;
      uint end;
    }

    struct Stake {
      uint rep;
      TimeRange[] available;
      uint availabilityExpires;
      bool locked;
      bool released;
      mapping (address => uint) venueContribution;
    }

    struct Dibs {
      address payer;
      address recipient;
      uint amount;
    }

    struct Poll {
      address initiator;
      uint minStake;
      int venueCost;
      uint venuePot;
      address venuePayer;
      uint8 minParticipants;
      TimeRange eventTime;
      bool stakingClosed;
      bool proofsWindowClosed;
      mapping (address => Stake) staked;
      mapping (address => uint16) ownCheckInIndex;           // 1-indexed: ownCheckInIndex[s]==0 => nothing there.
      Dibs[] dibsCalled;
    }

    struct PollExternal {
      address initiator;
      uint minStake;
      int venueCost;
      uint venuePot;
      address venuePayer;
      uint8 minParticipants;
      uint8 participants;
      TimeRange eventTime;
      bool proofsWindowClosed;
      // NB external view of Poll can never correctly represent ownCheckInIndex (a mapping to a dynamic array).
      // Need to either make it indicative, or fixed size.

      // getting arrays with web3 is weird. Possibly claims ABI error?
      // bytes32[5][] cantremember;
      // address[] provers;
      // dibs[] dibsCalled;
    }

    // shared across contracts
    mapping (address => uint) rep;
    mapping (bytes32 => bytes32[]) allTheData;
    mapping (string => Poll) public pollData;
    mapping (bytes32 => bool) resultsCache;

    // used only in Poll
    mapping(uint8 => address) internal __validators;
    mapping(uint8 => string) internal __validatorNames;
    mapping(address => uint) internal __cashBalance;
    mapping(address => bool) internal stakerKnown;      // will move to Poll
    mapping(address => bool) internal isCurrentMiner;      // will move to Poll
    address[] knownMiners;
    uint initialRep = 2000;      // will move to Poll
    uint topupRep = 1500;        // will move to Poll
    bool anyoneCanMine = true;   // will move to Poll
    bool constructorHasRun;   // will move to Poll
    bool initialValuesWereSet = true;   // will move to Poll
    address __selfAddy ;


    // unused - previously for Storage Proxy
    //    mapping (address => bool) internal _allowedAccess;

    // used only in Validators

      // used for testing only - will be deleted.
      address pollAddress = 0x9D26a8a5Db7dC10689692caF8d52C912958409CF;

    // constants: Do not use space in storage.
    uint8 constant vType=1;
    string constant vDesc = "mutual agreement";
    uint constant never = 5377017599;
    bool constant usingRealMoney = false;

    struct proofCounter {
        bool fakeProof;
        int8 duplicateProofs;
        uint8 fakeProofs;
        bool senderIsPresent;
    }


    using strings for *;
    using stringcast for string;
    using SafeMath for int;
    using SafeMath for uint;

    function () payable external {
        _fallback();
    }

    // function() external payable {
    //     // NB sol 0.6+ better syntax for calldata arrays : https://solidity.readthedocs.io/en/v0.6.0/types.html#array-slices
    //     bytes memory input = msg.data;
    //
    //     // TODO: This is V.0 accepting a string (really a bytes32) of EXACTLY 32 bytes, eg a doodle poll without the https:// ;)
    //     bytes32 __ownAdress;  // NB assuming 32b rather than 20b for calldata loose packing. Remember to get rid of this line when optimising!
    //     bytes memory usefulData;
    //     bytes32 poll32;
    //     bytes memory __reveal;
    //     // demo result! (we don;t need more th     // will move to Pollan bool really ;)
    //     uint256 valid = 7331;
    //
    //     (__ownAdress, usefulData) = (bytesSplit32(input));
    //     (poll32, __reveal) = (bytesSplit32(usefulData));
    //
    //     // NB other validators will need to additionally retrieve reveal data from msg.data
    //     bytes32[] memory stakers = crossContractCall (encodeFunctionName("staker"), bytes32ToString(poll32), valid, vType);
    //     bytes32[] memory proofs = crossContractCall (encodeFunctionName("proof"), bytes32ToString(poll32), valid, vType);
    //
    // }

    constructor () public {
      fakeConstructor ();
    }

    function getInitialisedValues () public returns (uint, uint) {
      return (initialRep, topupRep);
    }

    function fakeConstructor () public {
      constructorHasRun = true;
      initialRep = 2000;     // will move to Poll
      topupRep = 1500;       // will move to Poll
      anyoneCanMine = true;       // temporary!!
    }

    function initialiseDemo (string memory _poll) public {
      pollData[_poll].minStake = 1000;
      pollData[_poll].venueCost = 12500;
      // pollData[_poll].staked[msg.sender].rep = 1;
      // pollData[_poll].staked[msg.sender].venueContribution =
      // pollData[_poll].staked[msg.sender].venueContribution[msg.sender] = 15000;
      fakeConstructor ();
    }

    function _fallback() internal {
        bytes memory input = msg.data;

    }

    function multiplier() public view returns (uint numerator, uint denominator) {
      return (5,4);
    }

    function maxRep() public view returns (uint maxRep) {
      return (3000);
    }

    modifier onlyOwner() {
      if (owner==msg.sender)
        _;
      else
        revert (':P');
    }

    modifier isMiner() {
      if (isCurrentMiner[msg.sender])
        _;
      else
        revert ('Not authorised to mine rep');
    }

    modifier isInitiator(string memory _poll) {
      if (pollData[_poll].initiator == msg.sender || pollData[_poll].initiator == address(0))
        _;
      else
        revert ('Venue cost may only be set by initator of the poll');
    }

    // any staker OR venue contributor
    function isStaker(string memory poll) public returns (bool) {
      address[] memory stakers = getStakerAddresses(poll);
      bool senderIsPresent;

      for(uint i = 0; i < stakers.length; i++) {
        if (stakers[i] == msg.sender) {
          senderIsPresent = true;
        }
      }
      return senderIsPresent;
    }

    // only rep stakers, not venue contributors
    modifier onlyStaker(string memory poll) {
      require((isStaker(poll) && pollData[poll].staked[msg.sender].rep>0), "Function may only be called by a staker on this poll");
      _;
    }

    event logStuff (string);
    function doEmit (string memory message) public {
      emit logStuff (message);
    }

    function isPoll(string memory _poll) public view returns (bool) {
      if (
        pollData[_poll].initiator!=address(0)
        || pollData[_poll].minStake >0
        || pollData[_poll].venueCost >0
        || pollData[_poll].venuePot >0
        || pollData[_poll].minParticipants >0
        || pollData[_poll].proofsWindowClosed
        || pollData[_poll].eventTime.start >0
        || pollData[_poll].eventTime.end > 0
      ) return true;
      return false;
    }

    function getPoll(string memory _poll) public view returns (
      address initiator,
      uint minStake,
      // uint venueContribution,
      int venueCost,
      uint venuePot,
      uint8 minParticipants,
      uint start,
      uint end,
      bool proofsWindowClosed,
      // dibs[] memory dibsCalled,
      bytes32[5][] memory ownCheckInIndex ) {

      initiator = pollData[_poll].initiator;
      minStake = pollData[_poll].minStake;
      venueCost = pollData[_poll].venueCost;
      venuePot = pollData[_poll].venuePot;
      minParticipants = pollData[_poll].minParticipants;
      proofsWindowClosed = pollData[_poll].proofsWindowClosed;
      start = pollData[_poll].eventTime.start;
      end = pollData[_poll].eventTime.end;
      // start = 1591535900000;
      // end = 1591536000000;
      // dibsCalled = pollData[_poll].dibsCalled;
      // stake = pollData[_poll].staked[_staker].rep;
      // venueContribution = pollData[_poll].staked[_staker].venueContribution[_staker];

      return (initiator, minStake, venueCost, venuePot, minParticipants, start, end, proofsWindowClosed, ownCheckInIndex);
    }

    function getPollStruct(string memory _poll) public view returns (PollExternal memory returnPoll) {

      // bytes32[5][] ownCheckInIndex;
      // address[] provers;
      // dibs[] dibsCalled;

        returnPoll.minStake = 1000;
        returnPoll.venueCost = 40000;
        returnPoll.venuePot = 40000;
        returnPoll.minParticipants = 3;
        returnPoll.participants = 3;
        returnPoll.eventTime.start = 1591535900000;
        returnPoll.eventTime.end = 1591536000000;
      return returnPoll;
    }

    function setByHash (bytes32 _hash, bytes32[] memory _data) public {
      allTheData[_hash] = _data;
    }

    function getByHash (bytes32 _hash) public view returns (bytes32[] memory) {
      return (allTheData[_hash]);
    }

    function get (string memory _poll, string memory _mapName) public view returns (bytes32[] memory) {
        bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), vType));
        return (allTheData[hash]);
    }

    function set (string memory _poll, string memory _mapName, address _stakerOrZero, uint8 _vt, bytes32[] memory _data) public {
      bytes32 hash;
      if (_stakerOrZero == address(0)) {
        hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), _vt));
      } else {
        hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), bytes20(_stakerOrZero), _vt));
      }
      allTheData[hash] = new bytes32[](_data.length);
      // bytes32[] memory data = new bytes32[](_data.length);
      for(uint16 i=0; i < _data.length; i++) {
        allTheData[hash][i] = _data[i];
      }
      // allTheData[hash] = data;

      // tried a number of ways and it is always reverting (when called via checkIn)
    }

    // function setString (string memory _poll, string memory _mapName, uint8 _vt, string memory data) public {
    //   bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), _vt));
    //   allTheData[hash] = stringToBytes32Array(data);
    // }


    // NB vulnerable until proper poll factory in place, since isInitiator allows any caller if poll.iniator == 0x0
    function setVenueCost (string memory poll, int cost) public isInitiator(poll) {
      pollData[poll].venueCost = cost;
    }

    // NB vulnerable until proper poll factory in place, since isInitiator allows any caller if poll.iniator == 0x0
    event eventTimeSet(string poll, uint start, uint end);
    function setEventTime (string memory poll, uint start, uint end) public isInitiator(poll) {
      pollData[poll].eventTime = TimeRange(start, end);
      emit eventTimeSet(poll, start, end);
    }

    // NB vulnerable until proper poll factory in place, since isInitiator allows any caller if poll.iniator == 0x0
    event eventStakingClosed(string poll, uint at);
    function closeStaking (string memory poll) public isInitiator(poll) {
      pollData[poll].stakingClosed = true;
      releaseStakes(poll);
      emit eventStakingClosed(poll, now);
    }

    function setRep (string memory _poll, address _staker, uint _rep) public {
      rep[_staker] = _rep;
    }

    function getRep (address staker) public view returns (uint) {
      return rep[staker];
    }

    function addMiner(address miner) public onlyOwner() {
      require(knownMiners.length < 65535, 'This aint the Yukon, buddy');

      if (knownMiners.length < 50)
        for(uint16 i=0; i < knownMiners.length; i++) {
          if (knownMiners[i] == miner)
            return;
        }
      knownMiners.push(miner);
      }

    function removeMiner(address miner) public onlyOwner() {
      for(uint16 i=0; i < knownMiners.length; i++) {
        if (knownMiners[i] == miner)
          knownMiners[i]=address(0);
      }
    }

    function mineRep(address recipient) public isMiner() returns (uint newRep) {
      return doMine(recipient);
    }

    function anyoneMineRep() public returns (uint newRep) {
      if (anyoneCanMine)
        return doMine(msg.sender);
      else
        return 0;
    }

    function canAnyoneMine(bool answer) public onlyOwner() {
      anyoneCanMine = answer;
    }

    function getAnyoneCanMine() public returns (bool){
      return anyoneCanMine;
    }

    function doMine(address recipient) private returns (uint newRep) {
      if (stakerKnown[recipient])
        newRep = topupRep;
      else {
        stakerKnown[recipient] = true;
        newRep = initialRep;
      }
      if (newRep >= rep[recipient]) {
        rep[recipient] = newRep;
        return (newRep);
      }
      return (0);
    }

    function emptySofa (uint amount) onlyOwner public {
      // <= Byzantium
      msg.sender.transfer(amount);
      // >= Istanbul
      // msg.sender.call.value(amount)("");
    }

    event newPollCreated(string poll);
    function createPoll(string memory poll, address initiator, uint minStake, int venueCost, address venuePayer, uint8 participants) public {
      require (!isPoll(poll), 'Poll exists already.');
      require (minStake>0, 'minStake must be set');
      if (initiator == address(0))
        pollData[poll].initiator = msg.sender;
      else
        pollData[poll].initiator = initiator;
      pollData[poll].minStake = minStake;
      pollData[poll].venueCost = venueCost;
      pollData[poll].venuePayer = venuePayer;
      pollData[poll].minParticipants = participants;


      emit newPollCreated(poll);
    }

    function coversTimeRange (TimeRange memory outer, TimeRange memory inner) internal returns (bool) {
      if (outer.start<=inner.start && inner.end<=outer.end)
        return true;
      else
        return false;
    }

    function isCommittedToSomeTime (string memory poll, address staker) public returns (bool) {
      for (uint16 i=0; i<pollData[poll].staked[staker].available.length; i++) {
        if (coversTimeRange(pollData[poll].eventTime, pollData[poll].staked[staker].available[i]))
          return true;
      }
      return false;
    }

    event stakeReleased (string poll, address staker);
    event stakeLocked (string poll, address staker);
    function releaseStakes (string memory poll) isInitiator(poll) public {
      address[] memory stakers = getStakerAddresses(poll);
      bool eventTimeIsSet;

      if (pollData[poll].eventTime.end>0 && pollData[poll].eventTime.end<never)
        eventTimeIsSet = true;
      for (uint16 i=0; i<stakers.length; i++) {
        if (!eventTimeIsSet) {
          pollData[poll].staked[stakers[i]].released=true;
          emit stakeReleased(poll, stakers[i]);
        } else
          if (isCommittedToSomeTime(poll, stakers[i])) {
            pollData[poll].staked[stakers[i]].locked=true;
            emit stakeLocked(poll, stakers[i]);
          } else {
            pollData[poll].staked[stakers[i]].released=true;
            emit stakeReleased(poll, stakers[i]);
          }
      }
    }

    // event whassahash(bytes);
    // event whassakeccack(bytes32);
    function getStakersProof (string memory _poll, address _staker) public returns (bytes32[] memory) {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName("proof"), _staker, vType));
      return (allTheData[hash]);
    }

    // function getProofEmitHashesOnlyWithStaker (string memory _poll, string memory _mapName, address _stakerOrZero, uint8 _vt, bytes32[] memory data) public {
    //   bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), _stakerOrZero, _vt));
    //   emit gpResult(_poll, _mapName, _stakerOrZero, _vt, getStakersProof(_poll, _stakerOrZero));
    // }


    function addStaker (string memory poll, address staker, uint8 vt) public {
      bytes32[] memory rawStakers = get(poll, "staker");
      require(rawStakers.length < 65535, 'Too many stakes. Try a pitchfork instead');

      bytes32 hash = keccak256(abi.encodePacked(poll, encodeFunctionName("staker"), vt));
      allTheData[hash].push (bytes32(bytes20(staker)));
    }

    function getStakerAddresses (string memory _poll ) public view returns (address[] memory) {
      bytes32[] memory rawStakers = get(_poll, "staker");
      address[] memory stakers = new address[](rawStakers.length);
      for(uint16 i=0; i < rawStakers.length; i++) {
          stakers[i] = bytesToAddress(bytes32ToBytes(rawStakers[i]));
      }
      return stakers;
    }

    function getproofsAsAddresses (string memory _poll ) public returns (address[][] memory) {
      address[] memory stakers = getStakerAddresses(_poll);
      address[][] memory proofs = new address[][](stakers.length);
      bytes32[] memory rawProof;

      for(uint16 i=0; i < stakers.length; i++) {
        rawProof = getStakersProof(_poll, stakers[i]);
        proofs[i] = new address[](rawProof.length);
        for(uint16 j=0; j < rawProof.length; j++) {
            proofs[i][j]=(bytesToAddress(bytes32ToBytes(rawProof[j])));
        }
      }
      return (proofs);
    }

    // event gpResult(string, string, address, uint8, bytes32[]);
    // function setCheckedInWithStaker (string memory _poll, string memory _mapName, address _impersonatedStaker, uint8 _vt, bytes32[] memory data) public {
    //   bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_mapName), _impersonatedStaker, _vt));
    //   emit whassahash(abi.encodePacked(_poll, encodeFunctionName(_mapName), _impersonatedStaker, _vt));
    //   emit whassakeccack(hash);
    //   allTheData[hash] = data;
    //   emit gpResult(_poll, _mapName, _impersonatedStaker, _vt, getStakersProof(_poll, _impersonatedStaker));
    // }


    // deprecated - use addProof
    function checkIn (string memory _poll, address _impersonatedStaker, address[] memory _newProof) public {
      address sender = _impersonatedStaker;   //  should be msg.sender
      uint16 idx = pollData[_poll].ownCheckInIndex[sender];
      bool hasStaked = false;
      uint16 i;

      // if (idx==0) {
      //   idx = uint16(getStakerAddresses(_poll ).length);
      //   add (_poll, "proof", vType, _newProof);
      //   pollData[_poll].ownCheckInIndex[sender] = idx+1;    // would be an off-by-one but ownIndex is 1-indexed ;)
      //   return;
      // }
      // proofs[idx] = bytes32(bytes20(_newProof));

      // bytes32[] memory stakers = get(_poll, "staker");
      // for (i=0; i<stakers.length; i++) {
      //   if bytes32(bytes20((stakers[i]))==sender
      //     hasStaked = true;
      // }
      // if (hasStaked = false)
      //   revert ('Staker has not staked in this poll')
      bytes32[] memory proofB32 = new bytes32[](_newProof.length);
      for (i=0; i<_newProof.length; i++) {
        proofB32[i]=bytes32(bytes20(_newProof[i]));
      }
      set ( _poll, "proof", sender, vType, proofB32);
      pollData[_poll].ownCheckInIndex[sender] = idx+1;
    }

    event proofUpdated(address staker);
    function addProof (string memory _poll, address _impersonatedStaker, address[] memory _newProof) public {
      address sender = _impersonatedStaker;   //  should be msg.sender
      bytes32[] memory proofB32 = new bytes32[](_newProof.length);
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName("proof"), bytes20(_impersonatedStaker), vType));
      for (uint16 i=0; i<_newProof.length; i++) {
        proofB32[i]=bytes32(bytes20(_newProof[i]));
      }
      if (allTheData[hash].length>0)
        emit proofUpdated(sender);
      allTheData[hash]=(proofB32);
    }

    function addProofSelf (string memory _poll, address[] memory _newProof) public {
      addProof (_poll, msg.sender, _newProof);
    }

    // TODO!
    function allstakersSubmittedProofs (string memory poll) public returns (bool) {
      return true;
    }


    // NB allstakersSubmittedProofs is still TODO!
    event proofsWindowClosed (string poll, address by);
    function closeProofsWindow (string memory poll) onlyStaker(poll) public {
      require (now > pollData[poll].eventTime.end || allstakersSubmittedProofs(poll), "Not all stakers have submitted proofs and the event is not yet over");
      // require (, "");
      pollData[poll].proofsWindowClosed = true;
      emit proofsWindowClosed (poll, msg.sender);

      // NB here assuming that poll can be closed once all stakers have submitted a proof.
      // The alternative would allow a non-attending staker to hold up refunds (by refusing to submit 'I can't make it')
      // but this way means that early provers cannot necessarily revise rpoofs which turn out not to fit consensus
      // This policy may be better left to differ between validators.
    }

    function reopenProofsWindow (string memory _poll) public {
      pollData[_poll].proofsWindowClosed = false;
    }

    function isProofsWindowClosed (string memory _poll) public view returns (bool ) {
      return pollData[_poll].proofsWindowClosed;
    }


    event expiryWasSet(string poll, address staker, uint availabilityExpires);
    event availabilityAdded(string poll, address staker, uint start, uint end);
    function addAvailability (string memory poll, uint start, uint end, uint confirmBefore) onlyStaker(poll) public {
      require (end>now, 'Cannot add availability in the past');
      require ((confirmBefore==0 || confirmBefore>=now), 'Cannot set expiry in the past');
      require(knownMiners.length < 65535, 'Too available. Have some self-respect');

      TimeRange memory available = TimeRange(start, end);

      if (confirmBefore > pollData[poll].staked[msg.sender].availabilityExpires) {
        pollData[poll].staked[msg.sender].availabilityExpires = confirmBefore;
        emit expiryWasSet(poll, msg.sender, confirmBefore);
      }

      pollData[poll].staked[msg.sender].available.push(available);
      emit availabilityAdded(poll, msg.sender, start, end);
    }


    event stakeNotAccepted(address staker, string poll);
    event disreputableStakerIgnored(address staker, string poll);
    event staked(address staker, string poll, uint amount);
    event madeVenueContribution(address staker, string poll, uint amount);
    // TODO: accept one TimeRange for all stakes.
    // TODO: accept TimeRanges per stake (need to change up the data structures!)

    // NB addFakeStake only does NOT add anyone to stakers unless there no existing stakers (do it manually)
    function addFakeStake (string memory poll, address impersonatedStaker, uint repStake, uint venueContribution, address beneficiary ) onlyOwner public {
      bytes32[] memory rawStakers = get(poll, "staker");
      address sender = impersonatedStaker;

      if (venueContribution>0) {
        uint currentVC = pollData[poll].staked[sender].venueContribution[beneficiary];
        pollData[poll].staked[sender].venueContribution[beneficiary] += venueContribution;
        pollData[poll].venuePot += venueContribution;
        if (rawStakers.length==0)
          addStaker (poll, sender, vType);
        emit madeVenueContribution(sender, poll, venueContribution);
      }
      if (repStake>0) {
        if (repStake<pollData[poll].minStake) {
          emit stakeNotAccepted(sender, poll);              // aNt!p4ttrnn ###
        } else
        if (rep[sender]<repStake) {
          emit disreputableStakerIgnored(sender, poll);
        } else {
          if (!pollData[poll].stakingClosed) {
            rep[sender] -= repStake;
            if (rawStakers.length==0)
              addStaker (poll, sender, vType);
            pollData[poll].staked[sender].rep += repStake;
            emit staked(sender, poll, repStake);
          } else {
            emit staked(sender, poll, 0);
          }
        }
      }
    }

    function addUnboundedStake (string memory poll, uint repStake, address beneficiary) payable public {
      address sender = msg.sender;
      if (msg.value>0) {
        uint currentVC = pollData[poll].staked[sender].venueContribution[beneficiary];
        pollData[poll].staked[sender].venueContribution[beneficiary] += msg.value;
        pollData[poll].venuePot += msg.value;
        if (!isStaker(poll))
          addStaker (poll, sender, vType);
        emit madeVenueContribution(sender, poll, msg.value);
      }
      if (repStake>0) {
        if (repStake<pollData[poll].minStake) {
          emit stakeNotAccepted(sender, poll);              // aNt!p4ttrnn ###
        } else
        if (rep[sender]<repStake) {
          emit disreputableStakerIgnored(sender, poll);
        } else {
          if (!pollData[poll].stakingClosed) {
            rep[sender] -= repStake;
            if (!isStaker(poll))
              addStaker (poll, sender, vType);
            pollData[poll].staked[sender].rep += repStake;
            emit staked(sender, poll, repStake);
          } else {
            emit staked(sender, poll, 0);
          }
        }
      }
    }

    function addStake (string memory poll, uint repStake, address beneficiary, TimeRange[] memory availability, uint confirmBefore) payable public {
      require ((confirmBefore==0 || confirmBefore>=now), 'Cannot set expiry in the past');

      address sender = msg.sender;
      if (msg.value>0) {
        uint currentVC = pollData[poll].staked[sender].venueContribution[beneficiary];
        pollData[poll].staked[sender].venueContribution[beneficiary] += msg.value;
        pollData[poll].venuePot += msg.value;
        if (!isStaker(poll))
          addStaker (poll, sender, vType);
        emit madeVenueContribution(sender, poll, msg.value);
      }
      if (repStake>0) {
        if (repStake<pollData[poll].minStake) {
          emit stakeNotAccepted(sender, poll);              // aNt!p4ttrnn ###
        } else
        if (rep[sender]<repStake) {
          emit disreputableStakerIgnored(sender, poll);
        } else {
          if (!pollData[poll].stakingClosed) {
            rep[sender] -= repStake;
            if (!isStaker(poll))
              addStaker (poll, sender, vType);
            pollData[poll].staked[sender].rep += repStake;
            emit staked(sender, poll, repStake);
          } else {
            emit staked(sender, poll, 0);
          }
        }
      }

      if (confirmBefore > pollData[poll].staked[sender].availabilityExpires) {
        pollData[poll].staked[sender].availabilityExpires = confirmBefore;
        emit expiryWasSet(poll, msg.sender, confirmBefore);
      }

      for(uint16 i=0; i < availability.length; i++) {
        if (availability[i].end > now) {
          addAvailability (poll, availability[i].start, availability[i].end, confirmBefore);
        }
      }
    }

    function totalRepStaked (string memory _poll, address _staker) public view returns (uint) {
      return pollData[_poll].staked[_staker].rep;
    }

    function totalVenueContribs (string memory _poll, address _staker) public view returns (uint total) {
      // dibs[] memory dibsList = allDibsPaidBy(_staker);


      // gives an out of bounds error (or munches it into VM..blah..blah)
      // trying to access ...[address(0)]
      // total = pollData[_poll].staked[_staker].venueContribution[_staker] + pollData[_poll].staked[_staker].venueContribution[address(0)];
      total = pollData[_poll].staked[_staker].venueContribution[_staker];

      // for(uint16 i = 0; i < dibsList.length; i++) {
      //   total += dibsList[i].amount;
      // }

      return total;
    }

    // NB refundVenueStake and refundStake BOTH call this, so one will revert.
    // TODO: Add checks into those functions
    event emptyStakeRemoved (string poll, address staker);
    function removeEmptyStake (string memory _poll, address _staker) public {
      uint rep=pollData[_poll].staked[msg.sender].rep;
      uint venueContributions = totalVenueContribs (_poll, _staker);
      require (rep==0 && venueContributions==0, 'Staker has non empty stake or venue contribution');
      delete pollData[_poll].staked[msg.sender];
      emit emptyStakeRemoved(_poll, msg.sender);
    }

    // NB these require returning complex type.
    // Keep the commented code, but integrate it direct into functions which need it (and eventually use new ABI encoder on it ;)

    // function allDibsPaidBy(string memory _poll, address _staker) public view returns (dibs[] memory) {
    //   uint16 size=0;
    //   uint16 i;
    //   for(i = 0; i < pollData[_poll].dibsCalled.length; i++) {
    //     if (pollData[_poll].dibsCalled[i].payer == _staker)
    //       size++;
    //   }
    //   dibs[size] memory dibsList = new dibs[](size);
    //   for(uint16 i = 0; i < pollData[_poll].dibsCalled.length; i++) {
    //     if (pollData[_poll].dibsCalled[i].payer == _staker)
    //       dibsList.push(pollData[_poll].dibsCalled[i]);
    //   }
    //   return dibsList;
    // }
    //
    // function allDibsPaidFor(string memory _poll, address _recipient) public view returns (dibs[] memory) {
    //   uint16 size=0;
    //   uint16 i;
    //   for(i = 0; i < pollData[_poll].dibsCalled.length; i++) {
    //     if (pollData[_poll].dibsCalled[i].recipient == _recipient)
    //       size++;
    //   }
    //   dibs[size] memory dibsList = new dibs[](size);
    //   for(i = 0; i < pollData[_poll].dibsCalled.length; i++) {
    //     if (pollData[_poll].dibsCalled[i].recipient == _recipient)
    //       dibsList.push(pollData[_poll].dibsCalled[i]);
    //   }
    //   return dibsList;
    // }


    function doRefund (address to, uint amount) private returns (bool){
      if (usingRealMoney)
        // <= Byzantium
        msg.sender.transfer(amount);
        // >= Istanbul
        // msg.sender.call.value(amount)("");
      return true;
    }

    // NB proportional refunds are not vulnerable to gas exhaustion but covering refunds may be.
    // Hence populating the 0x0 staker's stake with the refunded stakes, to maintain the size of stakes compared to venuePot.
    event venuePotDisbursed (string poll, address to, address by, uint amount);
    // Any staker can call refund of excess venue pot.
    // Disbursement to venue payer must wait until initiator has actively set venue payer (eg to self);
    // NB ONLY successful stakers on the poll will have venueContribs refunded
    // -need some way for non rep stakers to be included in getStakerAddresses
    function refundVenueStakes(string memory _poll) public onlyStaker(_poll) {
      address[] memory stakers = getStakerAddresses(_poll);
      int equalShare = (pollData[_poll].venueCost) / int(stakers.length);
      uint pot = pollData[_poll].venuePot;
      uint spareCash =1234;
      uint16 i =0;
      uint16 j =0;

      if (pot==0)
        return;
      // This would be so much simpler if you could compare whether a possibly negative number is smaller than a positive one.
      // and would be safer, not having a 2's complement risk. Fucking rectangulists.
      if ((pollData[_poll].venueCost<0) || uint(pollData[_poll].venueCost) < pollData[_poll].venuePot)
        spareCash = uint( int(pollData[_poll].venuePot) - pollData[_poll].venueCost );

      // // proportional refunds:
      // // allows recipients of gifted contributions to get a refund too
      for (i=0; i<stakers.length; i++) {
        uint refund = 0;
        address[] memory recipients = new address[](2);
        int[] memory amounts = new int[](2);
        //   for (stakes = allDibsPaidBy(staker).concat(staker.stake[staker]).concat(staker.stake[0x0]))
        recipients[0] = address(0);
        recipients[1] = stakers[i];
        // what if this loop runs out of gas? Will the totals that everything is based on still be a good starting point?
        for (j=0; j<recipients.length; j++) {
          amounts[j] = int( pollData[_poll].staked[stakers[i]].venueContribution[recipients[j]] );
          refund += ( spareCash * (uint(amounts[j])) / pot );
          pollData[_poll].staked[stakers[i]].venueContribution[recipients[j]] = 0;
          // maintain a tally of refunded stakes in case of gas exhaustion.
          pollData[_poll].staked[address(0)].venueContribution[address(0)] += refund;
          if (pollData[_poll].venuePot >= refund)
            pollData[_poll].venuePot -= refund;
          else
            revert ('Someone emptied the pot!!');
        }
        if (refund>0 || stakers[i] == msg.sender)
          if (doRefund(stakers[i], refund))
            emit venuePotDisbursed (_poll, stakers[i], msg.sender, refund);

      }
      pollData[_poll].staked[address(0)].venueContribution[address(0)] = 0;

      //
      // // covering refunds:
      // // gifted contributions are used only to top up recipients'
      // for (i=0; i<stakers.length; i++) {
      //   int refund = 0;
      //   int totalPaid = 0;
      //   address[] memory recipients = new address[](2);
      //   int[] memory amounts = new int[](2);
      //   //   for (stakes = allDibsPaidBy(staker).concat(staker.stake[staker]).concat(staker.stake[0x0]))
      //   recipients[0] = address(0);
      //   recipients[1] = stakers[i];
      //   for (j=0; j<recipients.length; j++) {
      //     amounts[j] = int( pollData[_poll].staked[stakers[i]].venueContribution[recipients[j]] );
      //     totalPaid += amounts[j];
      //   }
      //   if (totalPaid > int(equalShare))
      //     for (j=0; j<recipients.length; j++) {
      //       // too tired for this!!
      //     }
      // }



      //     for (stakes = allDibsPaidFor(staker).concat(staker.stake[staker]).concat(staker.stake[0x0]))
      //       if amount>=shortfall
      //         totalPaid += shortfall
      //         shorten(stake)
      //       else
      //         totalPaid += amount
      //         remove(stake) including own stake!
      //     refund(0)
      // for stakers
      //   if exists(stake) (ie those who were not removed in last round)
      //     for (stakes = allDibsPaidBy(staker).concat(staker.stake[staker]).concat(staker.stake[0x0]))
      //       if amount>=shortfall
      //         totalPaid += shortfall
      //         refund += rest
      //       else
      //         totalPaid += amount
      //       remove(stake)
      //     refund (refund)
      //     emitsolidity uint16
      //

      if (pollData[_poll].staked[msg.sender].rep == 0)
        removeEmptyStake(_poll, msg.sender);
    }


    event repRefund (address staker, uint staked, uint refunded);
    event refundFail (address staker);
    function refundStake (string memory _poll, bytes32 _reveal) public onlyStaker(_poll) {
      require (pollData[_poll].staked[msg.sender].rep > 0, 'Sender has nothing staked for this poll');
      // Will ownCheckInIndex be a thing?
      // require (pollData[_poll].ownCheckInIndex[msg.sender] > 0, 'Sender has not submitted an attendance proof for this poll');
      (uint num, uint denom) = multiplier();

      if (!validate(msg.sender, _poll, _reveal)) {
        emit refundFail(msg.sender);
        // // no point trying to both emit and revert!
        // revert ('Not enough stakers included you in their check-ins. Your reputation is lost :(');
        return;
      }

      // refund = original stake, but if accepted (ie event was in time range) increase by multiplier, up until the maximum.
      uint refund = pollData[_poll].staked[msg.sender].rep;
      if (pollData[_poll].staked[msg.sender].locked) {
        refund = num.mul(pollData[_poll].staked[msg.sender].rep) / denom;
        if (rep[msg.sender] + refund > maxRep())
          refund = maxRep()-rep[msg.sender];
      }

      pollData[_poll].staked[msg.sender].rep = 0;
      rep[msg.sender] += refund;
      emit repRefund (msg.sender, pollData[_poll].staked[msg.sender].rep, refund);
      if (totalVenueContribs(_poll, msg.sender) == 0)
        removeEmptyStake(_poll, msg.sender);
    }


    function emitVenueStakeRefunded (string memory _poll, address _to, address _by, uint _amount, uint8 _repeat) public  {
      for (uint8 i=0; _repeat>0 && i<_repeat; i++) {
        emit venuePotDisbursed (_poll, _to, _by, _amount);
      }
    }

    function emitVenuePotRefunded (string memory _poll, address _to, address _by, uint _amount) public {
      emit venuePotDisbursed (_poll, pollData[_poll].venuePayer, _by, _amount);
    }

    function emitrepRefunded (address _staker, uint _staked, uint _refunded) public {
      emit repRefund (_staker, _staked, _refunded);
    }

    function emitrefundFail (address _staker) public {
      emit refundFail (_staker);
    }

    function isInList (address[] memory list, address target) private returns (bool) {
      for(uint j = 0; j < list.length; j++) {
        if (list[j] == target)
          return (true);
      }
      return (false);
    }


    // event numberLoggerLikeImUsingFuckingJava (string, uint);

    // cheapo validator - this one just counts how many people included you in their proof, with no attempt at making the proofs agree.
    // currently counts votes in favour of each stakers, which will help, but doesn't flag which poroofs disagree
    function validate(address _pollContract, string memory _poll, bytes32 _reveal) public returns (bool) {
        // require (_pollContract==howeverYoullIdentifySelf, 'wrong Poll contract - something needs upgrading');

        address[] memory stakers = getStakerAddresses(_poll);
        address[][] memory proofs = getproofsAsAddresses(_poll);
        uint16[] memory stakerPresentCount = new uint16[](stakers.length);
        uint16 i;
        uint16 sendersIndex;   // 1 indexed, 0=> not reached
        bool stakerPresent;

        uint16 threshold = 1;   //  do not set to 0 - div0 error!
        // emit numberLoggerLikeImUsingFuckingJava('stakers',stakers.length);
        // emit numberLoggerLikeImUsingFuckingJava('proofs',proofs.length);


        // deal with percentage thresholds (threshold == 10000+p where p= [percentage])
        if(threshold>10000 && threshold<=10100) {
          threshold = threshold-10000;
          threshold = (threshold*uint16(stakers.length))/100;
        }


        for(i = 0; i < stakers.length; i++) {
            if (stakers[i]==msg.sender)
              sendersIndex=i+1;
        }
        // sendersIndex will not be 0, since validate is private and should be called only be refundStake, which has onlyStaker modifier
        assert (sendersIndex>0);

        for(i = 0; i < stakers.length; i++) {
            // emit logStuff("started loop");
            stakerPresent = false;
            for(uint j = 0; j < proofs[i].length; j++) {
              if (proofs[i][j] == msg.sender)
                stakerPresent = true;

              // increase the present count for the address who this staker marked present
              // if this staker claims someone is here but the majority disagree, then emit disagreement;
              if (proofs[i][j] == msg.sender)
                stakerPresentCount[sendersIndex-1]++;
              else {
              //   // NB inefficient repeated loop - needs optimising before rolling out
              //   stakerPresentCount[stakerIndexOf((proofs[i][j])]++;
              }

            }
            // // if I am not present in this proof, but I have passed my own proof, where I am checked in, emit a disagreement;
            // if (!stakerPresent && sendersIndex>0 && isInList([sendersIndex-1], msg.sender))
            //   impugnProof(i);
        }
        // // if this staker claims someone is here but the majority disagree, then emit disagreement;

        // update majorities
        // check previous disagreements

        if (stakerPresentCount[sendersIndex-1]>=threshold)
          if (stakerPresentCount[sendersIndex-1] *2 >= proofs.length+1 )
          return true;
        return false;
    }


    function proofType() public pure returns (uint8) {
      return vType;
    }

    function encodeFunctionName (string memory name) internal pure returns (bytes4) {
        // TODO: cache for readability!
        // if ("staker")
        //     return
        // if ("proof")
        //     return
        return bytes4(keccak256(bytes(name)));
    }

    // split a serialised string of addresses (as received from main contract).
    // NB - only works in this validator - other validators will use multiple types within serialised string
    // function splitToAddresses(string memory _concatenated) internal pure returns (address[] memory result) {
    //     strings.slice memory delim = ",".toSlice();
    //     strings.slice memory source = _concatenated.toSlice();
    //     address[] memory parts = new address[](source.count(delim));
    //
    //     for(uint i = 0; i < parts.length; i++) {
    //        parts[i] = source.split(delim).toString().toAddress();
    //     }
    //     return parts;
    //
    // }

    function bytesToAddress(bytes memory _bytes) public pure returns (address) {
      address tempAddress;
      assembly {
          tempAddress := div(mload(add(add(_bytes, 0x20), 0)), 0x1000000000000000000000000)
      }
      return tempAddress;
    }

    // function toString(address account) public pure returns(string memory) {
    //     return toString(abi.encodePacked(account), 5);
    // }
    //
    // function toString(uint256 value) public pure returns(string memory) {
    //     return toString(abi.encodePacked(value), 0);
    // }
    //
    // function toString(bytes32 value) public pure returns(string memory) {
    //     return toString(abi.encodePacked(value), 0);
    // }
    //
    // function toString(bytes memory data, uint16 len) public pure returns(string memory) {
    //     bytes memory alphabet = "0123456789abcdef";
    //     uint16 strLen = 20;  // It's 20. The length is just fucking 20.  uint16(data.length);
    //     // Pretty simple if statement - why won't it work ?
    //     // if (len>0) {
    //     //     strLen = len;
    //     // }
    //
    //
    //     bytes memory str = new bytes(2 + strLen * 2);
    //     str[0] = '0';
    //     str[1] = 'x';
    //     for (uint i = 0; i < strLen; i++) {
    //         str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
    //         str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
    //     }
    //     return string(str);
    // }


    function bytes32ToBytes(bytes32 _bytes32) public pure returns (bytes memory){
        // string memory str = string(_bytes32);
        // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return bytesArray;
    }

    // function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
    //     bytes32 out;

    //     for (uint i = 0; i < 32; i++) {
    //         out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    //     }
    //     return out;
    // }


    function bytesToBytes32(bytes memory b) public pure returns (bytes32 bts) {
        bytes32 i;
        //NB size etc= 32b = 0x20b
        assembly { i := mload(add(b, 0x20)) }
        bts = i;
    }

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory ){
        bytes memory bytesArray = bytes32ToBytes(_bytes32);
        return string(bytesArray);
    }

    // function bytes32ArrayToString (bytes32[] memory data) public pure returns (string memory ) {
    //     bytes memory bytesString = new bytes(data.length * 32);
    //     uint urlLength;
    //     uint i=0;
    //     for (i=0; i<data.length; i++) {
    //         for (uint j=0; j<32; j++) {
    //             byte char = byte(bytes32(uint(data[i]) * 2 ** (8 * j)));
    //             if (char != 0) {
    //                 bytesString[urlLength] = char;
    //                 urlLength += 1;
    //             }
    //         }
    //     }
    //     bytes memory bytesStringTrimmed = new bytes(urlLength);
    //     for (i=0; i<urlLength; i++) {
    //         bytesStringTrimmed[i] = bytesString[i];
    //     }
    //     return string(bytesStringTrimmed);
    // }

    // function stringToBytes32Array(string memory source) public pure returns (bytes32[] memory result) {
    //     // uint16 words = uint16( (bytes(source).length+31)/32 );
    //     uint16 words = 1;
    //     for(uint16 i=0; i<=words; i++) {
    //       uint16 offset = 32*(i+1);
    //       bytes32 word;
    //       assembly {
    //         word := mload(add(source, offset))
    //       }
    //       result[i] = word;
    //     }
    //     return result;
    // }

    // TODO !!!
    // function bytes32ToUint (bytes32 data) returns (uint) {
    //     return 2;
    // }

    // function bytesSplit32(bytes  memory data) public pure returns (bytes32, bytes memory ) {
    //     uint8 splitAt = 32;                             // all (if variable split, pass in splitAt)
    //     uint256 taillength = 0;
    //     if (data.length > splitAt)
    //         taillength = data.length-splitAt;
    //     bytes32 temp;
    //     // bytes32 head;                                   // 32b split
    //     bytes memory head = new bytes(splitAt);         // variable length split
    //     bytes memory tail = new bytes(taillength);
    //     for(uint i=0;i<=data.length-1;i++){
    //         if (i<splitAt)
    //             head[i] = bytes(data)[i] ;
    //         else
    //             tail[i-splitAt] = bytes(data)[i] ;
    //     }
    //     return (bytesToBytes32(head), tail);
    // }

    // calls fallback function of pollAddress, passing 4 byte encoded function name to remote contract to select method.
    // NB future better: just get the ABI of the finished Poll conmtract, and use that!
    // NB in sol 0.6 + fallback cannot return anything
    // NB future optimisation : we are not using the functionality of string here, since string must have come from a bytes32

    // event CrossContractValidateBegin();
    // event CrossContractValidateEnd();
    // function crossContractCall (bytes4 fnNameHash, string  memory poll, uint256 valid, uint8 vt) public returns (bytes32[] memory) {
    // address pollContract = pollAddress;
    //
    //     emit CrossContractValidateBegin();
    //     assembly {
    //         let ptr := mload(0x40)
    //         calldatacopy(ptr, 0, calldatasize)
    //         let result := delegatecall(gas, pollContract, ptr, calldatasize, 0, 0)
    //         let size := returndatasize
    //         returndatacopy(ptr, 0, size)
    //         switch result
    //         case 0 { revert(ptr, size) }
    //         default { return(ptr, size) }
    //     }
    //     emit CrossContractValidateEnd();
    // }

}
