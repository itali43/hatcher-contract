// approve.js
// `npx hardhat run --network saigon scripts/approve.js`
// DEVNOTE: This approves for a EOA. Alter for any address?

require("dotenv").config();

const { ethers, JsonRpcProvider } = require("ethers");
// const { Alchemy } = require("alchemy-sdk");

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;
const MGR_ADDR = process.env.MANAGER_CONTRACT_ADDRESS;
const ANIMA_ADDR = process.env.ANIMA_CONTRACT_ADDRESS;
const APRS_ADDR = process.env.APRS_CONTRACT_ADDRESS;

const amount = "10000000000"; // Amount of tokens you want to approve

// Define the contract address and the ABI (Application Binary Interface)
const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const contractABI = [
  // Minimal ABI to include only the function you need
  "function setApprovalForAll(address operator, bool approved)",
];

// Create a signer
const privateKey = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT; // Be careful with your private key
const signer = new ethers.Wallet(privateKey, provider);

// Connect to your contract
const hatcherContract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
);

// Connect to the Ethereum network
// provider - ronin
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

// ERC-20 Token Contract ABI
const erc20Abi = require("./animaABI.json");

// Create a contract instance
const animaTokenContract = new ethers.Contract(
  ANIMA_ADDR,
  erc20Abi.abi,
  signer
);
const aprsTokenContract = new ethers.Contract(APRS_ADDR, erc20Abi.abi, signer);

async function approveTokens() {
  console.log("begin token approval, $ANIMA!");

  try {
    const txApprove = await contract.methods
      .setApprovalForAll(MGR_ADDR, true)
      .send({ from: signer });
    // // Call the approve function
    // const tx = await animaTokenContract.approve(
    //   MGR_ADDR,
    //   ethers.parseUnits(amount, 18)
    // );
    console.log("Transaction Hash:", txApprove.hash);

    // Wait for the transaction to be mined
    await tx.wait();
    console.log("Approval successful");
  } catch (error) {
    console.error("Error:", error);
  }

  try {
    // Call the approve function

    const tx = await aprsTokenContract.approve(
      MGR_ADDR,
      ethers.parseUnits(amount, 18)
    );
    console.log("Transaction Hash:", tx.hash);

    // Wait for the transaction to be mined
    await tx.wait();
    console.log("Approval successful");
  } catch (error) {
    console.error("Error:", error);
  }

  const contract = new web3.eth.Contract(ERC721ABI, nftContractAddress);

  async function isApprovedForAll(owner, operator) {
    return await contract.methods.isApprovedForAll(owner, operator).call();
  }

  // Usage
  isApprovedForAll("0xOwnerAddress", "0xOperatorAddress").then(console.log);

  console.log("after.");
}

approveTokens();
