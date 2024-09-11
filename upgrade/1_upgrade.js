// IMPORTANT: Do Not Forget to change the HatcherV3 twice over in HH config!!!!!!
// after task edit, run with: npx hardhat deploy/2_upgrade.js --network saigon
// reference: https://docs.skymavis.com/ronin/smart-contracts/tutorials/deploy

const { ethers, upgrades } = require("hardhat");
require("dotenv").config();
const { TASK_SOURCIFY } = require("hardhat-deploy");

const hatcherAddr = process.env.TESTNET_PROXY_HATCHER_ADDR;

const upgrade = async () => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Upgrading to HatcherV3...");

  const proxyAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;

  const HatcherNewVersion = await ethers.getContractFactory("HatcherV3");
  const HatcherVersionOLD = await ethers.getContractFactory("HatcherV2");

  //   const forceImport = await upgrades.forceImport(
  //     proxyAddress,
  //     HatcherVersionOLD,
  //     { kind: "uups" }
  //   );
  //   console.log("Import Forced: ", forceImport);

  const upgradeResp = await upgrades.upgradeProxy(
    proxyAddress,
    HatcherNewVersion,
    {
      timeout: 600000,
      pollingInterval: 2500,
      gasPrice: 50000000000,
    }
  );

  //   const upgraded = await upgrades.upgradeProxy(proxyAddress, hatcherV3.address);

  console.log(
    `HatcherV3 has been deployed and proxy upgraded: ${upgradeResp.address}`
  );
};

async function main() {
  upgrade();

  await hre.run("VerifyContracts", {
    contractName: "HatcherV3",
    address: "0x15420f9108f6706f0b18130c3c4e3e18190e1527",
  });
}

main().catch(console.error);
