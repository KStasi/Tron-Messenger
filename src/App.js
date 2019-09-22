import React, { Component } from "react";
import TronWeb from "tronweb";

import './App.css';
import Body from "./Body";

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tronWeb: {
                installed: false,
                loggedIn: false
            }
        };
    }

    async componentDidMount() {
        await new Promise(resolve => {
            const tronWebState = {
                installed: !!window.tronWeb,
                loggedIn: window.tronWeb && window.tronWeb.ready
            };

            if (tronWebState.installed) {
                this.setState({
                    tronWeb: tronWebState
                });

                return resolve();
            }

            let tries = 0;

            const timer = setInterval(() => {
                if (tries >= 10) {

                    window.tronWeb = new TronWeb({
                        fullHost: 'https://api.shasta.trongrid.io'
                    });

                    this.setState({
                        tronWeb: {
                            installed: false,
                            loggedIn: false
                        }
                    });
                    clearInterval(timer);
                    return resolve();
                }

                tronWebState.installed = !!window.tronWeb;
                tronWebState.loggedIn = window.tronWeb && window.tronWeb.ready;

                if (!tronWebState.installed) {
                    return tries++;
                }

                this.setState({
                    tronWeb: tronWebState
                });

                resolve();
            }, 100);
        });

        if (!this.state.tronWeb.loggedIn) {
            window.tronWeb.on("addressChange", () => {
                if (this.state.tronWeb.loggedIn) {
                    return;
                }

                this.setState({
                    tronWeb: {
                        installed: true,
                        loggedIn: true
                    }
                });
            });
        }

        this.tronWeb = window.tronWeb;
    }

    render() {
        if (!this.state.tronWeb.installed) return (
            <div>TronWeb not installed!</div>
        );

        if (!this.state.tronWeb.loggedIn) return (
            <div>Log In Into Your TronWeb!</div>
        );

        return (
            <div>
                <Body/>
            </div>
        );
    }
}

export default App;
