pragma solidity ^0.4.24;

import "./interfaces/ENS.sol";

contract FakeENS is ENS{

    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping (bytes32 => Record) records;

    // Permits modifications only by the owner of the specified node.
    modifier only_owner(bytes32 node) {
        require(records[node].owner == msg.sender);
        _;
    }

    constructor() public {
        records[0x0].owner = msg.sender;
    }

    function owner(bytes32 _node) external constant returns (address){

    }
    function resolver(bytes32 _node) external constant returns (Resolver){

    }
    function ttl(bytes32 _node) external constant returns (uint64){

    }
    function setOwner(bytes32 node, address owner) external only_owner(node) {
        emit Transfer(node, owner);
        records[node].owner = owner;
    }
    function setSubnodeOwner(bytes32 _node, bytes32 _label, address _owner) external{

    }
    function setResolver(bytes32 _node, address _resolver) external{

    }
    function setTTL(bytes32 _node, uint64 _ttl) external{

    }
}