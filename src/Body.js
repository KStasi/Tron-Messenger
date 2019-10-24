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

        this.send = this.send.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.updateConnection = this.updateConnection.bind(this);
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

    async updateConnection() {
        let receiver = document.getElementById("receiverField");
        let base = bigInt(document.getElementById("baseField").value);
        let modulo = bigInt(document.getElementById("moduloField").value);
        var secretKey = bigInt(process.env.SECRET_KEY);
        var publicKey = base.modPow(secretKey, modulo).toString();
        return await this.state.messengerContract.updateConnection(receiver, base, modulo, publicKey).send(
            {
                shouldPollResponse: true
            }
        );
    }

    async getSharedKey(receiver) {
        var secretKey = bigInt(process.env.SECRET_KEY);
        let base, modulo, publicKey = bigInt(await this.state.messengerContract.getConnection(receiver).call());
        return publicKey.modPow(secretKey, modulo);
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
                <Form.Control id="baseField" type="number" placeholder="base" />
                <Form.Control id="moduloField" type="number" placeholder="modulo" />
                <Form.Control id="receiverField" type="text" placeholder="receiver" />
                <Form.Control id="messageField" type="text" placeholder="message" />
                <Button onClick={this.updateConnection} variant="danger">Update PK</Button>
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
