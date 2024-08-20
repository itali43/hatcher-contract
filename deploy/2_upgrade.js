// // npx hardhat run deploy/2_upgrade.js --network saigon
// const { TASK_SOURCIFY } = require("hardhat-deploy");
// // require("@nomiclabs/hardhat-waffle");

// const { ethers, upgrades, getNamedAccounts } = require("hardhat");
// require("dotenv").config();

// const upgrade = async () => {
//   const hatcherV1Address = process.env.TESTNET_PROXY_HATCHER_ADDR; // Replace with your deployed HatcherV1 address
//   const adminAddress = process.env.TESTNET_PUBLIC_KEY; // Replace with your proxy admin address
//   const implementationAddress = process.env.TESTNET_IMPLEMENTATION_HATCHER_ADDR; // Replace with the current implementation address of your proxy

//   // // FORCE IMPORT
//   // await upgrades.forceImport(hatcherV1Address, implementationAddress, {
//   //   from: adminAddress,
//   // });

//   console.log(`Proxy at ${proxyAddress} is now registered for upgrades.`);

//   //   const { getNamedAccounts } = await ethers.getNamedSigners();

//   const { deployer } = await getNamedAccounts();

//   // UPGRADE
//   console.log("Upgrading to HatcherV2...");

//   console.log("Upgrading to HatcherV2 22222...");

//   const HatcherV2 = await ethers.getContractFactory("HatcherV2");
//   console.log("Upgrading to HatcherV2 333333...", hatcherV1Address);

//   const hatcherV2 = await upgrades.upgradeProxy(hatcherV1Address, HatcherV2, {
//     from: deployer,
//   });

//   console.log(`HatcherV2 deployed to: ${hatcherV2.address}`);

//   await hre.run(TASK_SOURCIFY, {
//     endpoint: "https://sourcify.roninchain.com/server",
//   });
// };

// module.exports = upgrade;
// upgrade();
