pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import './Ownable.sol';

/**
* @author Arvind Kalra (github.com/arvindkalra) and Pranav Singhal (github.com/pranav-singhal)
* @title TokenStorage
*/
contract TokenStorage  is Ownable{
    using SafeMath for uint256;

    // Common storage structure for ALL contacts using this storage.
    // _, __, __ , etc are unused in this contract, but must remain to occupy their slots.

    address internal _registryContract;

    struct TimeRange {
      uint start;
      uint end;
    }

    struct Stake {
      uint rep;
      TimeRange[] available;
      uint availabilityExpires;
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
    mapping (address => uint) __rep;
    mapping (bytes32 => bytes32[]) __allTheData;
    mapping (string => Poll) public __pollData;
    mapping (bytes32 => bool) __resultsCache;

    // used only in Poll
    mapping(uint8 => address) internal __validators;
    mapping(uint8 => string) internal __validatorNames;
    mapping(address => uint) internal __cashBalance;
    mapping(address => bool) internal stakerKnown;      // will move to Poll
    mapping(address => bool) internal isCurrentMiner;      // will move to Poll
    address[] knownMiners;
    uint initialRep = 2000;      // will move to Poll
    uint topupRep = 1500;        // will move to Poll
    address selfAddy ;


    // unused - previously for Storage Proxy
    //    mapping (address => bool) internal _allowedAccess;

    // used only in Validators
    mapping (address => uint16) __stakerPresentIn;

      // used for testing only - will be deleted.
      address __pollAddress = 0x9D26a8a5Db7dC10689692caF8d52C912958409CF;

    // constants: Do not use space in storage.
    uint8 constant __vType=1;
    string constant __vDesc = "mutual agreement";


    constructor() public {
      _owner = msg.sender;
      uint initialRep = 2000;  
      uint topupRep = 1500;
    }

    function setProxyContract(address proxyContract) onlyOwner public{
        require(proxyContract != address(0), "InvalidAddress: invalid address passed for proxy contract");
        _registryContract = proxyContract;
    }

    function getRegistryContract() view public returns(address){
        return _registryContract;
    }

    //    function addDeligateContract(address upgradedDeligatee) public{
    //        require(msg.sender == _registryContract, "AccessDenied: only registry contract allowed access");
    //        _allowedAccess[upgradedDeligatee] = true;
    //    }

    modifier onlyAllowedAccess() {
        require(msg.sender == _registryContract, "AccessDenied: This address is not allowed to access the storage");
        _;
    }

    // Allowances with its Getter and Setter
    mapping (address => mapping (address => uint256)) internal _allowances;

    function setAllowance(address _tokenHolder, address _spender, uint256 _value) public onlyAllowedAccess {
        _allowances[_tokenHolder][_spender] = _value;
    }

    function getAllowance(address _tokenHolder, address _spender) public view onlyAllowedAccess returns(uint256){
        return _allowances[_tokenHolder][_spender];
    }


    // Balances with its Getter and Setter
    mapping (address => uint256) internal _balances;
    function addBalance(address _addr, uint256 _value) public onlyAllowedAccess {
        _balances[_addr] = _balances[_addr].add(_value);
    }

    function subBalance(address _addr, uint256 _value) public onlyAllowedAccess {
        _balances[_addr] = _balances[_addr].sub(_value);
    }

    function setBalance(address _addr, uint256 _value) public onlyAllowedAccess {
        _balances[_addr] = _value;
    }

    function getBalance(address _addr) public view onlyAllowedAccess returns(uint256){
        return _balances[_addr];
    }

    // Total Supply with Getter and Setter
    uint256 internal _totalSupply = 0;

    function addTotalSupply(uint256 _value) public onlyAllowedAccess {
        _totalSupply = _totalSupply.add(_value);
    }

    function subTotalSupply(uint256 _value) public onlyAllowedAccess {
        _totalSupply = _totalSupply.sub(_value);
    }

    function setTotalSupply(uint256 _value) public onlyAllowedAccess {
        _totalSupply = _value;
    }

    function getTotalSupply() public view onlyAllowedAccess returns(uint256) {
        return(_totalSupply);
    }
}
