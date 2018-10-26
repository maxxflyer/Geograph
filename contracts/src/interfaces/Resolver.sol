pragma solidity ^0.4.24;

contract Resolver {
    function addr(bytes32 _node) external constant returns (address); // eip137 : 0x3b3b57de
    // function name(bytes32 _node) external constant returns (string); // eip181 : 0x691f3431
    function ABI(bytes32 _node, uint256 _contentType) external constant returns (uint256, bytes); // eip205 : 0x2203ab56
    function pubkey(bytes32 _node) external constant returns (bytes32 x, bytes32 y); // eip619 : 0xc8690233
}