pragma solidity ^0.5.0;

import "./strings.sol";
// import "github.com/GNSPS/solidity-bytes-utils/contracts/BytesLib.sol";   // requires sol 0.5+
import "./stringCasting.sol";

contract PollReference {
    // Common storage structure for ALL contacts using this storage.
    // _, __, __ , etc are unused in this contract, but must remain to occupy their slots.

    address owner;  // is set by TokenStorage.. but retain types and order.

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
    mapping(uint8 => address) public validators;
    mapping(uint8 => string) public validatorNames;
    address selfAddy ;
    int flag;

    // unused - previously for Storage Proxy
    //    mapping (address => bool) internal _allowedAccess;


    using strings for *;
    using stringcast for string;

    constructor () public /* is PollCommunity */ {
        validators[1] = address(0xA145493CC19b0BC6C5a2cA86e9BA38BB435E3F5b);
        validatorNames[1] = "Mutual Agreement";
        selfAddy = address(this);
        // constructed = 1;
    }


    // function getPollOK() public view returns (uint8) {
    //   return ok;
    // }
    //
    // function setPollOK (uint8 _ok) public {
    //   ok = _ok;
    // }
    //
    // function getPollResult() public view returns (uint8) {
    //   return result;
    // }
    //
    // function setPollResult (uint8 _result) public {
    //   result = _result;
    // }
    //
    // function getMyMap(uint idx) public view returns (uint) {
    //   return myMap[idx];
    // }
    //
    // function setMyMap (uint idx, uint _myMap) public {
    //   myMap[idx] = _myMap;
    // }

    function getOwner() public view returns (address) {
      return owner;
    }

    function getFlag() public view returns (int) {
      return flag;
    }

    function setFlag(int _flag) public {
      flag = _flag;
    }

    function() external payable {
        // NB sol 0.6+ better syntax for calldata arrays : https://solidity.readthedocs.io/en/v0.6.0/types.html#array-slices
        bytes memory input = msg.data;

        // TODO: This is V.0 accepting a string (really a bytes32) of EXACTLY 32 bytes, eg a doodle poll without the https:// ;)
        bytes32 poll32;
        bytes memory rest;
        bytes4 fnNameHash;
        bytes32 result;
        bytes memory vType;

        (fnNameHash, rest) = (bytesSplit4(input));
        (poll32, rest) = (bytesSplit32(rest));
        (result, vType) = (bytesSplit32(rest));

        if (fnNameHash == encodeFunctionName("serialiseStakers")) {
            //NB wrapping these in bytes32 for testing, but keep as strings until you are ready to deserialise bytes32, cos they still good here!
            result = string32ToBytes32( serialiseStakers(bytes32ToString(poll32), toUint8(vType)) );
        }
        if (fnNameHash == encodeFunctionName("serialiseProofs")) {
            //NB wrapping these in bytes32 for testing, but keep as strings until you are ready to deserialise bytes32, cos they still good here!
            result = string32ToBytes32(serialiseProofs(bytes32ToString(poll32), toUint8(vType)) );
        }
        // Warning: This hack introduces possible griefing attack - better would be to force EVM to return the result of this lookup from fallback, not store and retreive it :/

        storeResult(poll32, fnNameHash, result, toUint8(vType));

        assembly {
            let size := 256
            let ptr := mload(0x40)
            mstore8(ptr, 88)
            return(ptr, size)
        }
    }

    // function ownAddress () public view returns (address) {
    //     return selfAddy;
    // }
    //
    // function getStateVars () public view returns (uint256, address, string memory, address, int8) {
    //     return (notes, validators[1], validatorNames[1], selfAddy, constructed);
    // }
    //
    // event ValidatorSet();
    // function setValidator1 (address newAddy) public returns (bool) {
    //     validators[1] = newAddy;
    //     emit ValidatorSet();
    //     return true;
    // }
    //
    // function getValidator1 () public view returns (address) {
    //     return validators[1];
    // }
    //
    // function setValidator1Name (string memory newName) public returns (bool) {
    //     validatorNames[1] = newName;
    //     emit ValidatorSet();
    //     return true;
    // }
    //
    // function getValidator1Name () public view returns (string memory) {
    //     return validatorNames[1];
    // }

    // event RetrievedDataCache(string, uint256, bytes32[]);
    function retrieve (string memory _poll, string memory _fnName, uint8 _vt) public view returns (bytes32[] memory) {
        bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
        // emit RetrievedDataCache("Poll context:", notes, allTheData[hash]);
        return (allTheData[hash]);
    }

    function set (string memory _poll, string memory _fnName, uint8 _vt, bytes32[] memory data) public {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
      allTheData[hash] = data;
    }

    function justSetStuff() public returns (string memory ace) {
      bytes32 b1 = bytes32(0x71776572747975696f706173646667686a6b6c7a786376626e6d313233343536);
      bytes32[] memory inp1;
      bytes32[] memory inp2;
      inp1[0] = b1;
      inp1[0] = b1;
      inp2[1] = b1;
      inp2[1] = b1;
      set ("doodle.com/poll/h7phtw5u2thhz9k4", "serialiseStakers", 1, inp1);
      set ("doodle.com/poll/h7phtw5u2thhz9k4", "serialiseProofs", 1, inp2);
    }

    function add (string memory _poll, string memory _fnName, uint8 _vt, address newMember) public {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
      allTheData[hash].push (bytes32(bytes20(newMember)));
    }

    function stringsEqual (string memory _a, string memory _b) internal pure returns (bool) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);

        if (a.length != b.length)
            return false;

        for (uint i = 0; i < a.length; i ++)
            if (a[i] != b[i])
                return false;

        return true;
    }

    function string32ToBytes32(string memory source) public pure returns (bytes32 result) {
        assembly {
        result := mload(add(source, 32))
        }
    }

    // split a serialised string of addresses (as received from main contract).
    // NB - only works in mutual agreement validator - other validators will use multiple types within serialised string
    function splitToAddresses(string memory source) public pure returns (address[] memory result) {
        strings.slice memory packed = source.toSlice();
        strings.slice memory delim = ",".toSlice();
        address[] memory parts = new address[](packed.count(delim)+1);  // why doesn't this lose a member?

        for(uint i = 0; i < parts.length; i++) {
           parts[i] = packed.split(delim).toString().toAddress();
        }
        return parts;
    }

    // function stringToBytes32(string memory source) {
    //     bytes32[] memory result;
    //     strings.slice memory remainder = source.toSlice();
    //     while (remainder.length >= 32) {

    //     }

    // }



    function bytesToBytes4(bytes  memory b)  public pure returns (bytes4 bts) {
        bytes4 i = 0x50505050;
        assembly { i := mload(add(b, 0x20)) }
        bts = i;
    }

    function bytesToBytes32(bytes  memory b)  public pure returns (bytes32 bts) {
        bytes32 i;
        //NB size etc= 32b = 0x20b
        assembly { i := mload(add(b, 0x20)) }
        bts = i;
    }

    function toUint8(bytes memory _bytes) internal pure returns (uint8) {
        require(_bytes.length >= (1), "Read out of bounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x1), 0))
        }

        return tempUint;
    }

    function bytes32ToBytes(bytes32 _bytes32) public pure returns (bytes memory){
        // string memory str = string(_bytes32);
        // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return bytesArray;
    }

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory){
        bytes memory bytesArray = bytes32ToBytes(_bytes32);
        return string(bytesArray);
    }

    function bytesSplit4(bytes memory data) public pure returns (bytes4, bytes memory) {
        uint8 splitAt = 4;                             // all (if variable split, pass in splitAt)
        uint256 taillength = 0;
        if (data.length > splitAt)
            taillength = data.length-splitAt;
        bytes4 temp;
        // bytes4 head;                                   // 4b split
        bytes memory head = new bytes(splitAt);         // variable length split
        bytes memory tail = new bytes(taillength);
        for(uint i=0;i<=data.length-1;i++){
            if (i<splitAt)
                head[i] = bytes(data)[i] ;
            else
                tail[i-splitAt] = bytes(data)[i] ;
        }
        return (bytesToBytes4(head), tail);
    }

    function bytesSplit32(bytes memory data) public pure returns (bytes32, bytes memory) {
        uint8 splitAt = 32;                             // all (if variable split, pass in splitAt)
        uint256 taillength = 0;
        if (data.length > splitAt)
            taillength = data.length-splitAt;
        bytes32 temp;
        // bytes32 head;                                   // 32b split
        bytes memory head = new bytes(splitAt);         // variable length split
        bytes memory tail = new bytes(taillength);
        for(uint i=0;i<=data.length-1;i++){
            if (i<splitAt)
                head[i] = bytes(data)[i] ;
            else
                tail[i-splitAt] = bytes(data)[i] ;
        }
        return (bytesToBytes32(head), tail);
    }


    function encodeFunctionName (string memory name) public pure returns (bytes4) {
        // TODO: cache for readability!
        // if ("serialiseStakers")
        //     return
        // if ("serialiseStakers")
        //     return
        return bytes4(keccak256(bytes(name)));
    }

    // temporary functionality to repoint to simple example, eg splitToAddresses
    function unpackData (string memory packed) public pure returns (bytes32[] memory result) {
        //NB relying on splitToAddresses doing string splitting here, as we rely on .length - available only on fixed size array.
        address[] memory asAddresses = splitToAddresses(packed) ;
        uint8 i = uint8(asAddresses.length) ;

        while (i-- > 0) {
            result[i] = bytes32(bytes20(asAddresses[i]));
        }
        return result;
    }

    function storeResult(bytes32 poll32, bytes4 fnNameHash, bytes32 data, uint8 vt)  public {
        // uint256 notesToStore = 10000+vt;
        if (vt == 1) {

            bytes32 hash = keccak256(abi.encodePacked(poll32, fnNameHash, vt));

            allTheData[hash] = unpackData(bytes32ToString(data));
            // notesToStore=260;
        }
        // notes += notesToStore;
    }

    function serialiseStakers(string memory _poll, uint8 validationType) public view returns (string memory) {
        string memory result = "Result! - from poll.serialiseStakers";
        return result;
    }

    function serialiseProofs(string memory _poll, uint8 validationType) public view returns (string memory) {
        string memory result = "Result! - from poll.serialiseProofs";
    }

    function xcValidate(address _pollContract, string memory _poll, bytes32 _reveal) public payable returns (bool success) {
    }

        // calls fallback function of contract at validatorAddress, passing 4 byte encoded function name to it to select method.
    // NB in sol 0.6 + fallback cannot return anything
    // NB future optimisation : we are not using the functionality of string here, since string must have come from a bytes32
    event CrossContractValidateBegin();
    event CrossContractValidateEnd();
    function crossContractValidateCall (address _validator, bytes4 fnNameHash, string memory poll, uint8 vt, bytes32[] memory reveal)  public returns (bytes32[] memory) {
        address validator = _validator;

        uint8 offset = 32;
        // NB 32b offset as space for validator contract address! (assumes no tight packing in calldata)
        // TODO: this will need to be chucked at the other end, unless you want to do the subtraction in assembly :/

        emit CrossContractValidateBegin();
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, validator, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)
            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
        emit CrossContractValidateEnd();
    }

    event CrossContractValidateReturned(bool);
    function callValidator_MututalAgreement(string memory _poll, string memory data) public returns (bool) {
        uint8 vType = 1;
        assert (stringsEqual(validatorNames[vType], "Mutual Agreement"));
        bytes32[] memory empty;

        // reveal parameter is unused in mutual agreement
        xcValidate(validators[vType], _poll, bytes32(0) );
        crossContractValidateCall(validators[vType], encodeFunctionName("validate") , _poll, vType, empty );
        //TODO: get return value!

        emit CrossContractValidateReturned(false);


    }
}
