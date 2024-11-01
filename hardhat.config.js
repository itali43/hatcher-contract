// require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("hardhat-deploy");

// require("@nomiclabs/hardhat-etherscan");
// require("hardhat-gas-reporter");
require("solidity-coverage");
require("@openzeppelin/hardhat-upgrades");
// require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

// require("@openzeppelin/hardhat-defender");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Do Not Forget to change the HatcherV3 twice over below!
// task(
//   "upgrade",
//   "Upgrades the contract to next Version of Hatcher",
//   async (taskArgs, hre) => {
// );

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20,
      },
    },
  },
  namedAccounts: {
    deployer: process.env.TESTNET_PRIVATE_KEY,
    // "privatekey://0x34efd74fe804caefc6aebc3424edc67ede2d0b9503401942077593090820cf93",
  },

  networks: {
    hardhat: {
      // forking: {
      //   url: process.env.TESTNET_POLYGON_URL,
      // },
      chainId: 0,
    },
    ronin: {
      chainId: 2020,
      url: "https://api.roninchain.com/rpc",
    },
    local: {
      chainId: 1337,
      url: "http://127.0.0.1:7545",
    },
    saigon: {
      chainId: 2021,
      url: "https://saigon-testnet.roninchain.com/rpc",
      // gasPrice: "auto", // Automatically adjusts the gas price
      gasPrice: 50000000000,
      accounts: [`${process.env.TESTNET_PRIVATE_KEY_TRADFORMAT}`],
    },
  },
  // gasReporter: {
  //   enabled: true,
  //   currency: "USD",
  //   // L1: "polygon",
  // },
  etherscan: {
    // apiKey: process.env.ETHERSCAN_API_KEY,
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  defender: {
    apiKey: process.env.DEFENDER_TEAM_API_KEY,
    apiSecret: process.env.DEFENDER_TEAM_API_SECRET_KEY,
  },
};
