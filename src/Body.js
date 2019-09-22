import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Swal from "sweetalert2";
import bigInt from "big-integer";
import CryptoJS from 'crypto-js';
let MODULO = 23;
let BASE = 5;

class Body extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contractAddress: process.env.CONTRACT_ADDRESS,
            messengerContract: null,
            messages: []
        };
        console.log(process.env);
        console.log(process.env.CONTRACT_ADDRESS);
        console.log(process.env.PK);
        console.log(process.env.SECRET_KEY);

        this.send = this.send.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.updatePublicKey = this.updatePublicKey.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.decrypt = this.decrypt.bind(this);
        this.getSharedKey = this.getSharedKey.bind(this);
    }

    async componentDidMount() {
        this.setState({messengerContract: await window.tronWeb.contract().at(this.state.contractAddress)});
        this.state.messengerContract.Message().watch(
            (err, res) => {
                if (err) return Swal.fire({
                    title: `Oups! Error: ${err}!`,
                    type: "error"
                });
                if (res.result) {
                    if (res.result._to === window.tronWeb.defaultAddress["hex"])
                    {
                        let messages = this.state.messages;
                        messages.push(res.result);
                        this.setState({messages: messages});
                    }
                    else if (res.result._from === window.tronWeb.defaultAddress["hex"])
                    {
                        let messages = this.state.messages;
                        messages.push(res.result);
                        this.setState({messages: messages});
                    }
                }
            });
    }

    getPublicKey() {
        var modulo = bigInt(MODULO);
        var base = bigInt(BASE);
        var secretKey = bigInt(process.env.SECRET_KEY);
        return  base.modPow(secretKey, modulo);
    }

    decrypt(index) {
        let messages = this.state.messages;
        let sharedKey = this.getSharedKey(messages[index]._to);
        let bytes  = CryptoJS.AES.decrypt(messages[index]._message, sharedKey.toString());
        messages[index]._message = bytes.toString(CryptoJS.enc.Utf8);
        let decryptButton = document.getElementById(`decryptButton${index}`);
        decryptButton.disabled = true;
        this.setState({messages: messages});
    }

    async updatePublicKey() {
        var publicKey = this.getPublicKey().toString();
        return await this.state.messengerContract.updatePublicKey(publicKey).send(
            {
                shouldPollResponse: true
            }
        );
    }

    async getSharedKey(receiver) {
        let modulo = bigInt(MODULO);
        var secretKey = bigInt(process.env.SECRET_KEY);
        let receiverPublicKey = bigInt(await this.state.messengerContract.publicKeys(receiver).call());
        return receiverPublicKey.modPow(secretKey, modulo);
    }

    async send() {
        let receiverField = document.getElementById("receiverField");
        let messageField = document.getElementById("messageField");
        let receiver = receiverField.value;
        let message = messageField.value;
        receiverField.value = "";
        messageField.value = "";

        return await this.state.messengerContract.send(receiver, message).send(
            {
                shouldPollResponse: true
            }
        );
    }

    async encrypt() {
        let receiver = document.getElementById("receiverField").value;
        let messageField = document.getElementById("messageField");
        console.log(process.env.CONTRACT_ADDRESS);
        let sharedKey = this.getSharedKey(receiver);
        messageField.value = CryptoJS.AES.encrypt(messageField.value, sharedKey.toString()).toString();
    }

    renderMessage(message, index) {
        let {_from, _to, _message} = message;
        let className, username;
        if (_from === window.tronWeb.defaultAddress["hex"]) {
            username = _to;
            className = "sent";
        } else {
            username = _from;
            className = "received";
        }
        return (
            <li className={className}>
                <div className="messageContent">
                    <div className="username">
                        {`${(className === "sent") ? "To: " : "From: "} ${username}`}
                    </div>
                    <div className="text">{_message}</div>
                    <Button onClick={()=>this.decrypt(index)} id={`decryptButton${index}`} variant="danger">Decrypt</Button>
                </div>
            </li>
        );
    }

    render() {
        const messages = this.state.messages;
        return (
            <div>
                <Form.Control id="receiverField" type="text" placeholder="receiver" />
                <Form.Control id="messageField" type="text" placeholder="message" />
                <Button onClick={this.updatePublicKey} variant="danger">Update PK</Button>
                <Button onClick={this.encrypt} variant="danger">Encrypt</Button>
                <Button onClick={this.send} variant="danger">Send</Button>
                <ul className="messagesList">
                    {messages.map((message, index) => this.renderMessage(message, index))}
                </ul>
            </div>
        );
    }
}

export default Body;
