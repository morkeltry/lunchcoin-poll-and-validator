pragma solidity >=0.4.21 <0.6.0;

import './Proxy.sol';

// OpenZeppelin Address library current versions require >= Constantinople, as they use extcodehash opcode
// import "openzeppelin-solidity/contracts/utils/Address.sol";

/**
 * @title UpgradeabilityProxy
 * @dev This contract implements a proxy that allows to change the
 * implementation address to which it will delegate.
 * Such a change is called an implementation upgrade.
 */
contract UpgradeabilityProxy is Proxy {
    /**
     * @dev Emitted when the implementation is upgraded.
     * @param implementation Address of the new implementation.
     */
    event Upgraded(address implementation);

    /**
     * @dev Storage slot with the address of the current implementation.
     * This is the keccak-256 hash of "org.zeppelinos.proxy.implementation", and is
     * validated in the constructor.
     */
    bytes32 private constant IMPLEMENTATION_SLOT = 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;

    /**
     * @dev Contract constructor.
     * @param _implementation Address of the initial implementation.
     */
    constructor(address _implementation) public {
        assert(IMPLEMENTATION_SLOT == keccak256("org.zeppelinos.proxy.implementation"));

        _setImplementation(_implementation);
    }

    /**
     * @dev Returns the current implementation.
     * @return Address of the current implementation
     */
    function _implementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    /**
     * @dev Upgrades the proxy to a new implementation.
     * @param newImplementation Address of the new implementation.
     */
    function _upgradeTo(address newImplementation) internal {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    // OpenZeppelin Address library v.2.3.0 is safe for Byzantium
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.3.0/contracts/utils/Address.sol
    function isContract(address account) internal view returns (bool) {
        // This method relies in extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }


    /**
     * @dev Sets the implementation address of the proxy.
     * @param newImplementation Address of the new implementation.
     */
    function _setImplementation(address newImplementation) private {
        // require(Address.isContract(newImplementation), "Cannot set a proxy implementation to a non-contract address");
        require(isContract(newImplementation), "Cannot set a proxy implementation to a non-contract address");

        bytes32 slot = IMPLEMENTATION_SLOT;

        assembly {
            sstore(slot, newImplementation)
        }
    }
}
