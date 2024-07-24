// breedPlanetRaw.js
// `npx hardhat run --network saigon scripts/breedPlanetEOA.js`
// DEVNOTE: ON TESTNET

require("dotenv").config();

const { ethers, JsonRpcProvider } = require("ethers");
// const { Alchemy } = require("alchemy-sdk");

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;
const BREEDING_ADDR = process.env.TESTNET_BREEDING_CONTRACT_ADDRESS;
const toAddress = process.env.TESTNET_PUBLIC_KEY;
const planetIdA = 4119;
const planetIdB = 11;
const shouldUseMiniBlackhole = false;

// contract ABI
const contract = require("./breedABI.json");
const { boolean } = require("hardhat/internal/core/params/argumentTypes");

// provider - ronin
// const provider = new ethers.providers.getDefaultProvider(
//   process.env.SAIGON_URL
// );

// provider - ronin
console.log(process.env.SAIGON_URL);
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

// signer - you
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// contract instance
const breedContract = new ethers.Contract(
  BREEDING_ADDR,
  contract.output.abi,
  signer
);

async function main() {
  // number of transactions one wants to do
  count = 1;

  amountPerMint = 1;
  console.log("Breed Operation Initiate!");

  //   geni = ethers.utils.defaultAbiCoder.encode(["bool"], [true]);

  const message = await breedContract.requestBreed(
    planetIdA,
    planetIdB,
    shouldUseMiniBlackhole,
    {
      overrideParams: true,
      gasPrice: ethers.parseUnits("30", "gwei"), // Can set this >= to the number read from Ganache window
      gasLimit: 1000000,
      value: ethers.parseUnits("0.2", "ether"),
    }
  );

  console.log("The nonce is: ", message.nonce);
  console.log(
    "===================MSG=======================================MSG===================="
  );
  console.log("===================MSG====================");
  console.log("===================MSG====================");
  console.log(
    "===================MSG=======================================MSG===================="
  );
  console.log(message);
  console.log(
    "==================END=====================================END===================="
  );
  console.log("==================END==================");
  console.log(
    "==================END=====================================END===================="
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
