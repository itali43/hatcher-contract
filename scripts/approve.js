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

// Connect to the Ethereum network
// provider - ronin
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

const signer = new ethers.Wallet(PRIVATE_KEY, provider);

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
    // Call the approve function
    const tx = await animaTokenContract.approve(
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

  console.log("anima operation complete...");

  console.log("Begin token approval, $ARPS!");

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

  console.log("after.");
}

approveTokens();
