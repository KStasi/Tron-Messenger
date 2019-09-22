var messenger = artifacts.require("./Messenger.sol");

module.exports = function(deployer) {
 deployer.deploy(messenger);
};
