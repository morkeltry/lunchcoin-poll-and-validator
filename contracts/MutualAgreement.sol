pragma solidity ^0.5.0;

import "./strings.sol";
import "./stringCasting.sol";
// import "./BytesLib.sol";


/* empty contract - the real one is depolyed at an address which will be passed as param to validate */

// contract PollReference {
//     function serialiseStakers(string calldata _poll, uint8 validationType) external returns (address[] memory) {
//         // return something which will make it obvious that you have accidentally delegated this context!
//         address[] memory ret = new address[](3);
//         (ret[0], ret[1], ret[2]) = (address(9), address(9), address(9));
//         return ret;
//
//     }
//
//     function serialiseProofs(string calldata _poll, uint8 validationType) external returns (address[] memory) {
//         // return something which will make it obvious that you have accidentally delegated this context!
//         address[] memory ret = new address[](4);
//         (ret[0], ret[1], ret[2], ret[3]) = (address(6), address(6), address(6), address(6));
//         return ret;
//     }
// }


/* Lunchcoin validator contract - mutual agreement */
contract MutualAgreement {
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
    mapping(uint8 => address) public __validators;
    mapping(uint8 => string) public __validatorNames;
    address __selfAddy ;


    int160 flag;

    // unused - previously for Storage Proxy
    //    mapping (address => bool) internal _allowedAccess;

    // used only in Validators

      // used for testing only - will be deleted.
      address pollAddress = 0x9D26a8a5Db7dC10689692caF8d52C912958409CF;

    // constants: Do not use space in storage.
    uint8 constant vType=1;
    string constant vDesc = "mutual agreement";


    struct proofCounter {
        bool fakeProof;
        int8 duplicateProofs;
        uint8 fakeProofs;
        bool senderIsPresent;
    }


    using strings for *;
    using stringcast for string;

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
    //     // demo result! (we don;t need more than bool really ;)
    //     uint256 valid = 7331;
    //
    //     (__ownAdress, usefulData) = (bytesSplit32(input));
    //     (poll32, __reveal) = (bytesSplit32(usefulData));
    //
    //     // NB other validators will need to additionally retrieve reveal data from msg.data
    //     bytes32[] memory stakers = crossContractCall (encodeFunctionName("serialiseStakers"), bytes32ToString(poll32), valid, vType);
    //     bytes32[] memory proofs = crossContractCall (encodeFunctionName("serialiseProofs"), bytes32ToString(poll32), valid, vType);
    //
    // }

    constructor () public {
        // testing constructor access to storage across shared storage
        // (one for later ;)
        // constructed = 1;
    }

    function _fallback() internal {
        bytes memory input = msg.data;


    }
    //
    // function getMaOK() public view returns (uint8) {
    //   return ok;
    // }
    //
    // function setMaOK (uint8 _ok) public {
    //   ok = _ok;
    // }
    //
    // function getMaResult() public view returns (uint8) {
    //   return result;
    // }
    //
    // function setMaResult (uint8 _result) public {
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

    // function getOwner() public view returns (address) {
    //   return owner;
    // }
    //
    // event pollAddressSet();
    // function setPollAddress (address newAddy) public returns (bool) {
    //     pollAddress = newAddy;
    //     emit pollAddressSet();
    //     return true;
    // }
    //
    // function getPollAddress () public view returns (address) {
    //     return pollAddress;
    // }
    //
    // function getStateVars () public view returns (uint256, uint8, string memory, address, int8) {
    //     return (notes, vType, vDesc, pollAddress, constructed);
    // }

    event logStuff (string);

    function doEmit (string memory message) public {
      emit logStuff (message);
    }

    function getFlag() public view returns (int) {
      return flag;
    }

    function setFlag(int160 _flag) public {
      flag = _flag;
    }

    event RetrievedDataCache(string, uint256, bytes32[]);
    function retrieve (string memory _poll, string memory _fnName, uint8 _vt) public view returns (bytes32[] memory) {
        bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
        // emit RetrievedDataCache("Poll context:", notes, allTheData[hash]);
        return (allTheData[hash]);
    }

    function set (string memory _poll, string memory _fnName, uint8 _vt, bytes32[] memory data) public {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
      emit RetrievedDataCache("Validator context:", 424242, allTheData[hash]);
      allTheData[hash] = data;
    }

    function add (string memory _poll, string memory _fnName, uint8 _vt, address newMember) public {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
      allTheData[hash].push (bytes32(bytes20(newMember)));
    }

    function setString (string memory _poll, string memory _fnName, uint8 _vt, string memory data) public {
      bytes32 hash = keccak256(abi.encodePacked(_poll, encodeFunctionName(_fnName), _vt));
      // emit RetrievedDataCache("Poll context:", notes, allTheData[hash]);
      allTheData[hash] = stringToBytes32Array(data);
    }

    event whatTheFuck (string, uint16, uint, address, address, address);
    event cool (uint16, uint);
    event numberLoggerLikeImUsingFuckingJava (string, uint);
    /* simplest possible validator - checks that a majority of poll.stakers(), including sender, are contained in poll.serialiseProofs() */
    function validate(address _pollContract, string memory _poll, bytes32 _reveal) public view returns (bool) {
        // require (_pollContract==howeverYoullIdentifySelf, 'wrong Poll contract - something needs upgrading');

        bytes32[] memory rawStakers = retrieve(_poll, "serialiseStakers", vType);
        bytes32[] memory rawProofs = retrieve(_poll, "serialiseProofs", vType);

        // address[] memory stakers = splitToAddresses( bytes32ArrayToString(rawStakers));
        // address[] memory proofs = splitToAddresses( bytes32ArrayToString(rawProofs));

        address[] memory stakers = new address[](rawStakers.length);
        address[] memory proofs = new address[](rawProofs.length);
        uint16 i;

        for(i = 0; i < rawStakers.length; i++) {
            stakers[i] = bytesToAddress(bytes32ToBytes(rawStakers[i]));
        }
        for(i = 0; i < rawProofs.length; i++) {
            proofs[i] = bytesToAddress(bytes32ToBytes(rawProofs[i]));
        }
        uint8 threshold = 1 ;
        // emit numberLoggerLikeImUsingFuckingJava('stakers',stakers.length);
        // emit numberLoggerLikeImUsingFuckingJava('proofs',proofs.length);

        proofCounter memory pc;
        // emit logStuff("am alive");
        for(i = 0; i < proofs.length; i++) {
            // emit logStuff("started loop");
            pc.duplicateProofs = -1;
            for(uint j = 0; j < stakers.length; j++) {
                // emit whatThe ("Huh?",i,j,proofs[i], stakers[j], msg.sender);
                if (proofs[i] == stakers[j]) {
                    // emit cool (i,j);
                    // Only set senderIsPresent = true the first time that proofs[i] == stakers[j] == msg.sender
                    // if (proofs[i] == msg.sender) {
                    if (proofs[i] == msg.sender) {
                      pc.senderIsPresent = true;
                      // emit logStuff("found sender");
                      // flag = int160(1000*i+j);
                    }
                    // set duplicateProofs hopefully to 0, and remove staker from the array
                    pc.duplicateProofs++;
                    stakers[j] = address(0);
                    // emit logStuff("loop");
                }
            }
            if (pc.duplicateProofs>0) { pc.fakeProofs += uint8(pc.duplicateProofs); }
        }

        // // deal with 0 < threshold < 1
        // if(percentageThreshold>0) {
        //   threshold = percentageThreshold*stakers.length;
        // }
        // if (pc.senderIsPresent && (proofs.length-pc.fakeProofs >= threshold)) {
        //     return true;
        // }
        // return false;

        if (!pc.senderIsPresent)
            revert('Sender did not register attendance');
        if (proofs.length-pc.fakeProofs < threshold)
            revert('Not enough attendees in consensus');
        if (proofs.length == pc.fakeProofs)
            revert('All proofs were fake');

        // if (!pc.senderIsPresent)
        //     emit logStuff('Sender did not register attendance');
        // if (proofs.length-pc.fakeProofs < threshold)
        //     emit logStuff('Not enough attendees in consensus');
        // if (proofs.length == pc.fakeProofs)
        //     emit logStuff('All proofs were fake');
        // emit numberLoggerLikeImUsingFuckingJava ('fakeProofs',pc.fakeProofs);
        // emit numberLoggerLikeImUsingFuckingJava ('proofs.length',proofs.length);
        return true;
    }

    function serialiseStakers(string calldata _poll, uint8 validationType) external pure returns (address[] memory) {
        // return something which will make it obvious that you have accidentally delegated this context!
        address[] memory ret = new address[](4);
        (ret[0], ret[1], ret[2], ret[3]) = (address(5), address(0), address(5), address(0));
        return ret;
    }

    function serialiseProofs(string calldata _poll, uint8 validationType) external pure returns (address[] memory) {
        // return something which will make it obvious that you have accidentally delegated this context!
        address[] memory ret = new address[](4);
        (ret[0], ret[1], ret[2], ret[3]) = (address(0), address(5), address(0), address(5));
        return ret;
    }


    function proofType() public pure returns (uint8) {
      return vType;
    }

    function encodeFunctionName (string memory name) internal pure returns (bytes4) {
        // TODO: cache for readability!
        // if ("serialiseStakers")
        //     return
        // if ("serialiseStakers")
        //     return
        return bytes4(keccak256(bytes(name)));
    }

    // split a serialised string of addresses (as received from main contract).
    // NB - only works in this validator - other validators will use multiple types within serialised string
    function splitToAddresses(string memory _concatenated) internal pure returns (address[] memory result) {
        strings.slice memory delim = ",".toSlice();
        strings.slice memory source = _concatenated.toSlice();
        address[] memory parts = new address[](source.count(delim));

        for(uint i = 0; i < parts.length; i++) {
           parts[i] = source.split(delim).toString().toAddress();
        }
        return parts;

    }

    function bytesToAddress(bytes memory _bytes) public pure returns (address) {
      address tempAddress;
      assembly {
          tempAddress := div(mload(add(add(_bytes, 0x20), 0)), 0x1000000000000000000000000)
      }
      return tempAddress;
    }

    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account), 5);
    }

    function toString(uint256 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value), 0);
    }

    function toString(bytes32 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value), 0);
    }

    function toString(bytes memory data, uint16 len) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";
        uint16 strLen = 20;  // It's 20. The length is just fucking 20.  uint16(data.length);
        // Pretty simple if statement - why won't it work ?
        // if (len>0) {
        //     strLen = len;
        // }


        bytes memory str = new bytes(2 + strLen * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < strLen; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
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

    // function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
    //     bytes32 out;

    //     for (uint i = 0; i < 32; i++) {
    //         out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    //     }~/randomCode/truffletings/proxyBox
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

    function bytes32ArrayToString (bytes32[] memory data) public pure returns (string memory ) {
        bytes memory bytesString = new bytes(data.length * 32);
        uint urlLength;
        uint i=0;
        for (i=0; i<data.length; i++) {
            for (uint j=0; j<32; j++) {
                byte char = byte(bytes32(uint(data[i]) * 2 ** (8 * j)));
                if (char != 0) {
                    bytesString[urlLength] = char;
                    urlLength += 1;
                }
            }
        }
        bytes memory bytesStringTrimmed = new bytes(urlLength);
        for (i=0; i<urlLength; i++) {
            bytesStringTrimmed[i] = bytesString[i];
        }
        return string(bytesStringTrimmed);
    }

    function stringToBytes32Array(string memory source) public pure returns (bytes32[] memory result) {
        // uint16 words = uint16( (bytes(source).length+31)/32 );
        uint16 words = 1;
        for(uint16 i=0; i<=words; i++) {
          uint16 offset = 32*(i+1);
          bytes32 word;
          assembly {
            word := mload(add(source, offset))
          }
          result[i] = word;
        }
        return result;
    }

    // TODO !!!
    // function bytes32ToUint (bytes32 data) returns (uint) {
    //     return 2;
    // }

    function bytesSplit32(bytes  memory data) public pure returns (bytes32, bytes memory ) {
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

    // calls fallback function of pollAddress, passing 4 byte encoded function name to remote contract to select method.
    // NB future better: just get the ABI of the finished Poll conmtract, and use that!
    // NB in sol 0.6 + fallback cannot return anything
    // NB future optimisation : we are not using the functionality of string here, since string must have come from a bytes32
    event CrossContractValidateBegin();
    event CrossContractValidateEnd();
    function crossContractCall (bytes4 fnNameHash, string  memory poll, uint256 valid, uint8 vt) public returns (bytes32[] memory) {
    address pollContract = pollAddress;

        emit CrossContractValidateBegin();
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, pollContract, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)
            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
        emit CrossContractValidateEnd();
    }

}
