pragma solidity ^0.4.24;

import "./interfaces/Resolver.sol";

contract ENSResolver is Resolver{

    function supportsInterface(bytes4 _interfaceID) external pure returns (bool) {
        return _interfaceID == 0x3b3b57de
        // || _interfaceID == 0x691f3431
        || _interfaceID == 0x2203ab56
        || _interfaceID == 0xc8690233;
    }

    function addr(bytes32 _nodeID) external constant returns (address) {
        return address(this);
    }
}