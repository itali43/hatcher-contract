// DEPRECATED... ronin doesn't use Defender...

// scripts/deployTestnet.js
// npx hardhat run --network saigon scripts/deployTestnet.js
// DEPLOYS Hatcher.sol TO Ronin Testnet

const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  const domainName = "hatcher.gg";
  const name = "hatchergg";
  const version = "1";
  const _breedContractAddr = process.env.TESTNET_BREEDING_CONTRACT_ADDRESS;
  const _vrfValue = 0.2;
  const _nftContractAddr = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS;
  const HatcherContract = await ethers.getContractFactory("HatcherV1"); // 0x261D004c054F702F589754694c0af0fdE02018D3
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
      _breedContractAddr,
      _vrfValue,
      _nftContractAddr,
      process.env.TESTNET_SIGNER_PUBLIC_KEY, // _signer
    ],
    {
      initializer: "initialize",
    }
  );
  console.log("Hatcher deployed to:", deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
