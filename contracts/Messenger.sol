pragma solidity ^0.4.25;

contract Messenger {
    event Message(address _from, address _to, string _message);
    mapping (address => string) public publicKeys;

    function send(address to, string memory message) public {
        emit Message(msg.sender, to, message);
    }

    function updatePublicKey(string publicKey) public {
        publicKeys[msg.sender] = publicKey;
    }
}
