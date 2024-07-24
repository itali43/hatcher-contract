// approveAllForContract.js
// `npx hardhat run --network saigon scripts/approveAllAsOwner.js`
// DEVNOTE: This approves for the contract..

require("dotenv").config();

const { ethers, JsonRpcProvider } = require("ethers");

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;

// ADDRESSES TO CHOSE FROM TO APPROVE, CHANGE APPROVE_THIS_ADDR TO EQUAL ONE
const MGR_ADDR = process.env.MANAGER_CONTRACT_ADDRESS;
const ANIMA_ADDR = process.env.ANIMA_CONTRACT_ADDRESS;
const APRS_ADDR = process.env.APRS_CONTRACT_ADDRESS;
const NFT_ADDR = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS;

// THIS IS THE ADDRESS OF THE OPERATOR YOU'RE APPROVING, SELECT ACCORDINGLY FROM ABOVE
const APPROVE_THIS_ADDR = MGR_ADDR; // <-- CHANGE HERE.
const amount = "1000000000000000000"; // Amount of tokens you want to approve

// Connect to the Ethereum network
// provider - ronin
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

const signer = new ethers.Wallet(PRIVATE_KEY, provider); // must be owner of contract
// Define the contract address and the ABI (Application Binary Interface)
const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
// Create a signer

const contractABI = [
  // Minimal ABI to include only the function you need
  "function approveForAllAsOwner(address operator, bool approved)",
];
// Connect to your contract
const contract = new ethers.Contract(contractAddress, contractABI, signer);

async function approveAllAsOwner() {
  // Manager
  console.log("owner: ", signer.address);
  console.log("approving for: ", MGR_ADDR);
  try {
    // Call the setAllOf function with the new value
    const tx = await contract.approveForAllAsOwner(MGR_ADDR, true);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("MGR Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }

  // APRS
  console.log("owner: ", signer.address);
  console.log("approving for: ", APRS_ADDR);
  try {
    // Call the setAllOf function with the new value
    const tx = await contract.approveForAllAsOwner(APRS_ADDR, true);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("APRS Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }

  // Anima approve
  console.log("owner: ", signer.address);
  console.log("approving for: ", ANIMA_ADDR);
  try {
    // Call the setAllOf function with the new value
    const tx = await contract.approveForAllAsOwner(ANIMA_ADDR, true);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("ANIMA Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }

  // ERC721
  console.log("owner: ", signer.address);
  console.log("approving for: ", NFT_ADDR);
  try {
    // Call the setAllOf function with the new value
    const tx = await contract.approveForAllAsOwner(NFT_ADDR, true);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("All Approvals Launched 🚀🚀🚀");
}

approveAllAsOwner();
