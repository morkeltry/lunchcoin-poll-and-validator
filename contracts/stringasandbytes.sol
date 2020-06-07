pragma solidity >=0.4.21 <0.6.0;


contract StringsAndBytes {

    /* --- public variables for storing tests results */
    string public lastTestStringResult; //
    bytes32 public lastTestBytes32Result; //
    bytes public lastTestBytesResult; // bytes: dynamically-sized byte array
    bool public lastTestBoolResult; //


    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        // require(bytes(source).length <= 32); // causes error
        // but string have to be max 32 chars
        // https://ethereum.stackexchange.com/questions/9603/understanding-mload-assembly-function
        // http://solidity.readthedocs.io/en/latest/assembly.html
        assembly {
        result := mload(add(source, 32))
        }
    }//
    function stringToBytes32Test(string memory _string)  public returns (bytes32) {
        bytes32 _bytes32 = stringToBytes32(_string);
        lastTestBytes32Result = _bytes32;
        emit StringToBytes32(_string, _bytes32);
        return _bytes32;
    }//
    event StringToBytes32(
    string _string,
    bytes32 _bytes32
    );

    function isStringEqualOrShorterThan(string memory str, uint256 length) public pure returns (bool){
        return bytes(str).length <= length;
    }//
    function isStringEqualOrShorterThanTest(string memory str, uint256 length) public returns (bool){

        lastTestBoolResult = isStringEqualOrShorterThan(str, length);
        emit IsStringEqualOrShorterThan(str, length, lastTestBoolResult);

        return lastTestBoolResult;
    } //
    event IsStringEqualOrShorterThan(string str, uint256 length, bool result);

    /* bytes to string */
    function bytesArrayToString(bytes memory _bytes) public pure returns (string memory) {
        return string(_bytes);
    } //
    function bytesArrayToStringTest(bytes memory _bytes) public returns (string memory) {
        string memory result = bytesArrayToString(_bytes);
        emit BytesToString(_bytes, result);
        lastTestStringResult = result;
        return result;
    } //
    event BytesToString(
    bytes _bytes,
    string _string
    );

    /* string to bytes */
    function stringToBytesArray(string memory str) public pure returns (bytes memory){
        return bytes(str);
    } //
    function stringToBytesArrayTest(string memory str) public returns (bytes memory){
        bytes memory result = stringToBytesArray(str);
        lastTestBytesResult = result;
        emit StringToBytesArray(str, result);
        return result;
    } //
    event StringToBytesArray(string _string, bytes _bytes);

    /* bytes32 (fixed-size array) to bytes (dynamically-sized array) */
    function bytes32ToBytes(bytes32 _bytes32) public pure returns (bytes memory){
        // string memory str = string(_bytes32);
        // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return bytesArray;
    }//
    function bytes32ToBytesTest(bytes32 _bytes32) public returns (bytes memory){
        lastTestBytesResult = bytes32ToBytes(_bytes32);
        emit Bytes32ToBytes(_bytes32, lastTestBytesResult);
        return lastTestBytesResult;
    }//
    event Bytes32ToBytes(bytes32 _bytes32, bytes _bytes);

    /* bytes32 to string */
    // see also:
    // https://ethereum.stackexchange.com/questions/2519/how-to-convert-a-bytes32-to-string
    // https://ethereum.stackexchange.com/questions/1081/how-to-concatenate-a-bytes32-array-to-a-string
    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory){
        bytes memory bytesArray = bytes32ToBytes(_bytes32);
        return string(bytesArray);
    }//
    function bytes32ToStringTest(bytes32 _bytes32) public returns (string memory){
        lastTestStringResult = bytes32ToString(_bytes32);
        emit Bytes32ToString(_bytes32, lastTestStringResult);
        return lastTestStringResult;
    }//
    event Bytes32ToString(bytes32 _bytes32, string memory_string);


    /*
    function bytes32ToSring(bytes32 _bytes32) public returns (string memory){
        // string memory str = string(_bytes32);
        // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        string memory str = string(bytesArray);
        // for test:
        lastStringResult = str;
        Bytes32ToString(_bytes32, str);
        //
        return str;
    }
    */

    /*
    // https://ethereum.stackexchange.com/questions/2519/how-to-convert-a-bytes32-to-string
    // https://ethereum.stackexchange.com/questions/1081/how-to-concatenate-a-bytes32-array-to-a-string
    function bytes32ToString(bytes32 x) public pure returns (string memory) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }b
        string memory result = string(bytesStringTrimmed);
        return result;
    }
    */

    /* ethereum address to string */
    // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
    // https://ethereum.stackexchange.com/a/8447/1964
    function addressToAsciiString(address _address) public returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(_address) / (2 ** (8 * (19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    } //
    function char(byte b)  public pure returns (byte c) {
        if (uint8(b) < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }


    function addressToString(address _address) public returns (string memory) {
        return stringsConcatenation("0x", addressToAsciiString(_address));
    }

    function messageSenderAddressToString() public returns (string memory){
        return addressToString(msg.sender);
    }

    function messageSenderAddressToStringTest() public returns (string memory) {
        string memory senderString = addressToAsciiString(msg.sender);
        emit MsgSenderAddressToStringTest(msg.sender, senderString);
        lastTestStringResult = senderString;
        return senderString;
    } //
    event MsgSenderAddressToStringTest(address msgSenderAddress, string memorymsgSenderAsString);

    /* --------------------- strings functions begin        */
    /* --- https://github.com/Arachnid/solidity-stringutils */

    struct slice {uint _len; uint _ptr;}

    function memcpy(uint dest, uint src, uint len) private pure {
        for (; len >= 32; len -= 32) {
            assembly {
            mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }
        uint mask = 256 ** (32 - len) - 1;
        assembly {
        let srcpart := and(mload(src), not(mask))
        let destpart := and(mload(dest), mask)
        mstore(dest, or(destpart, srcpart))
        }
    }

    /*
     * @dev Returns a slice containing the entire string.
     * @param self The string to make a slice from.
     * @return A newly allocated slice containing the entire string.
     */
    function toSlice(string memory self) internal pure returns (slice memory) {
        uint ptr;
        assembly {
        ptr := add(self, 0x20)
        }
        return slice(bytes(self).length, ptr);
    }

    /*
     * @dev Returns a newly allocated string containing the concatenation of `self` and `other`.
     * @param self The first slice to concatenate.
     * @param other The second slice to concatenate.
     * @return The concatenation of the two strings.
     */
    function concat(slice memory self, slice memory other) internal returns (string memory) {
        string memory ret = new string(self._len + other._len);
        uint retptr;
        assembly {retptr := add(ret, 32)}
        memcpy(retptr, self._ptr, self._len);
        memcpy(retptr + self._len, other._ptr, other._len);
        return ret;
    }

    /*
     * @dev Joins an array of slices, using `self` as a delimiter, returning a newly allocated string.
     * @param self The delimiter to use.
     * @param parts A list of slices to join.
     * @return A newly allocated string containing all the slices in `parts`, joined with `self`.
     */
    function join(slice memory self, slice[] memory parts) internal returns (string memory) {
        uint i = 0;
        if (parts.length == 0)
        return "";
        uint length = self._len * (parts.length - 1);
        for (i = 0; i < parts.length; i++)
        length += parts[i]._len;
        string memory ret = new string(length);
        uint retptr;
        assembly {retptr := add(ret, 32)}
        for (i = 0; i < parts.length; i++) {
            memcpy(retptr, parts[i]._ptr, parts[i]._len);
            retptr += parts[i]._len;
            if (i < parts.length - 1) {
                memcpy(retptr, self._ptr, self._len);
                retptr += self._len;
            }
        }
        return ret;
    }
    /* --------------------- strings -- end   */

    function stringsConcatenation(string memory str1, string memory str2) public returns (string memory) {
        return concat(toSlice(str1), toSlice(str2));
    } //
    function stringsConcatenationTest(string memory str1, string memory str2) public returns (string memory) {
        string memory result = stringsConcatenation(str1, str2);
        lastTestStringResult = result;
        emit TestStringsConcatenation(str1, str2, result);
        return result;
    } //
    event TestStringsConcatenation(string str1, string str2, string result);

    function stringsJoin(string memory str1, string memory str2, string memory str3) public returns (string memory) {
        slice memory delimiter = toSlice(" ");
        // see: http://solidity.readthedocs.io/en/v0.4.15/types.html#arrays
        // http://solidity.readthedocs.io/en/v0.4.15/types.html#allocating-memory-arrays
        slice[] memory slicesArray = new slice[](3);
        slicesArray[0] = toSlice(str1);
        slicesArray[1] = toSlice(str2);
        slicesArray[2] = toSlice(str3);
        string memory result = join(delimiter, slicesArray);
        return result;
    } //
    function stringsJoinTest(string memory str1, string memory str2, string memory str3) public returns (string memory) {
        string memory result = stringsJoin(str1, str2, str3);
        lastTestStringResult = result;
        emit TestStringsJoin(str1, str2, str3, result);
        return result;
    } //
    event TestStringsJoin(string str1, string str2, string str3, string result);

}
