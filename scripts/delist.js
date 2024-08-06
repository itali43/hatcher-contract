// delist.js
// `npx hardhat run --network saigon scripts/delist.js`

const { ethers, JsonRpcProvider } = require("ethers");
const {} = ethers;

// Assuming you have an environment setup for accessing process.env variables
require("dotenv").config();

// NOTE: change planet id to what you'd like to delist
const planetId = 3344;

async function delistPlanet(planetId) {
  const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
  const NFT_ADDR = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS;
  const HATCHER_ADDR = process.env.TESTNET_PROXY_HATCHER_ADDR;

  const contractABI = [
    "function deList(uint256 idIndex, uint256 tokenId) public",
  ];
  const receiverContractAddress = contractAddress;

  const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;

  // provider - ronin
  // const provider = new ethers.providers.JsonRpcProvider(process.env.SAIGON_URL);
  const provider = new JsonRpcProvider(process.env.SAIGON_URL);

  // Setup provider and wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Assuming the ABI and contract address are set in your environment
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Call the delist function from the contract
    const tx = await contract.deList(0, planetId);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Planet delisted successfully");
  } catch (error) {
    console.error("Failed to delist planet:", error);
  }
}

// Example usage: delistPlanet('123');
// Make sure to replace '123' with the actual planet ID you want to delist
delistPlanet(planetId);
