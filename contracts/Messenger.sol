pragma solidity ^0.4.25;

contract Messenger {
    event Message(address _from, address _to, string _message);
    mapping (address => mapping(address => bytes[3])) public publicKeys;
    mapping (bytes32 => MessageTool) public chat;
    
    struct MessageTool {
        mapping(bytes32 => bytes) pablicKeys;
        bytes base;
        bytes modulo;
    }

    function send(address to, string memory message) public {
        emit Message(msg.sender, to, message);
    }
 
    function updatePublicKey(address mate, bytes base, bytes modulo, bytes publicKey) public {
        publicKeys[msg.sender][mate] = [base, modulo, publicKey];
    }
    
    function openChat(address[] mates, bytes base, bytes modulo) public returns (bytes32) {
        bytes32 hash = calculateIdentifier(abi.encodePacked(msg.sender), mates);
        chat[hash] = MessageTool(base, modulo);
        return hash;
    }
    
    function getChatPubkey(bytes32 chatHash, address[] mates) public view returns (bytes) {
        bytes32 hash = calculateIdentifier(new bytes(0), mates);
        return chat[chatHash].pablicKeys[hash];
    }
    
    function setChatPubkey(bytes32 chatHash, address[] mates, bytes publicKey) public returns (bytes32 hash) {
        hash = calculateIdentifier(abi.encodePacked(msg.sender), mates);
        chat[chatHash].pablicKeys[hash] = publicKey;
    }
    
    function calculateIdentifier(bytes memory initialIdentifier, address[] mates) public pure returns (bytes32 hash) {
        for (uint i = 0; i < mates.length; i++) {
            initialIdentifier = abi.encodePacked(initialIdentifier, mates[i]);
        }
        hash = keccak256(initialIdentifier);
    }
}