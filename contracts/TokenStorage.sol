pragma solidity >=0.4.21 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import './Ownable.sol';

/**
* @author Arvind Kalra (github.com/arvindkalra) and Pranav Singhal (github.com/pranav-singhal)
* @title TokenStorage
*/
contract TokenStorage  is Ownable{
    using SafeMath for uint256;

    // Common storage structure for ALL contacts using this storage.
    // Rename identifiers, eg to _, __, __ , etc. but retain types and order.

    // Access Modifier for Storage contract
    address internal _registryContract;

    struct timeRange {
      uint start;
      uint end;
    }

    struct stake {
      uint rep;
      timeRange[] available;
      uint availabilityExpires;
    }

    struct Poll {
      address initiator;
      uint minStake;
      uint venueCost;
      uint8 minParticipants;
      timeRange eventTime;
      mapping (address => stake) staked;
      mapping (address => bytes32[]) committedProofs;
    }

    // shared across contracts
    mapping (bytes32 => bytes32[]) allTheData;
    mapping (bytes32 => bool) resultsCache;

    // used only in Poll
    mapping(uint8 => address) public __validators;
    mapping(uint8 => string) public __validatorNames;
    address __selfAddy ;

    // unused - previously for Storage Proxy
    //    mapping (address => bool) internal _allowedAccess;

    // used only in Validators
    int flag;

      // used for testing only - will be deleted.
      address __pollAddress = 0x9D26a8a5Db7dC10689692caF8d52C912958409CF;

    // constants: Do not use space in storage.
    uint8 constant __vType=1;
    string constant __vDesc = "mutual agreement";


    constructor() public {
        _owner = msg.sender;
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
