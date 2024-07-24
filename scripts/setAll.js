// `npx hardhat run --network saigon scripts/setAll.js`

const { ethers, JsonRpcProvider } = require("ethers");

// Define the provider (e.g., connecting to Rinkeby testnet)
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

// Define the contract address and the ABI (Application Binary Interface)
const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const contractABI = [
  // Minimal ABI to include only the function you need
  "function setAllOf(address _breederContractAddr, uint256 _vrfValue,address _nftContractAddr)",
];

// Create a signer
const privateKey = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT; // Be careful with your private key
const signer = new ethers.Wallet(privateKey, provider);

// Connect to your contract
const contract = new ethers.Contract(contractAddress, contractABI, signer);

async function setAll() {
  console.log("owner: ", signer.address);
  try {
    const BREEDING_ADDR = process.env.TESTNET_BREEDING_CONTRACT_ADDRESS;
    const NFT_ADDR = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS;
    // Call the setAllOf function with the new value
    const tx = await contract.setAllOf(BREEDING_ADDR, 2, NFT_ADDR);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }
}

setAll();