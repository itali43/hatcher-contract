// scripts/deployTestnet.js
// npx hardhat run --network saigon scripts/deployTestnet.js
// DEPLOYS Hatcher.sol TO Ronin Testnet

const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const domainName = "hatcher.gg";
  const name = "hatchergg";
  const version = "1";
  const HatcherContract = await ethers.getContractFactory(
    "LastRemainsHatcherV1"
  ); // 0x261D004c054F702F589754694c0af0fdE02018D3
  console.log("Deploying HatcherGG to Testnet...");

  //   address _breedContractAddr,
  //   uint256 _vrfValue,
  //   address _nftContractAddr,
  //   address _signer
  const { address: deployedAddress } = await upgrades.deployProxy(
    HatcherContract,
    [
      domainName,
      version,
      ,
      _breedContractAddr,
      _vrfValue,
      _nftContractAddr,
      process.env.TESTNET_SIGNER_PUBLIC_KEY, // _signer
    ],
    {
      initializer: "initialize",
    }
  );
  console.log("LR Hatcher deployed to:", deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
