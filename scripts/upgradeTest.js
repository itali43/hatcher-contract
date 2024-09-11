// approve.js
// `npx hardhat run --network saigon scripts/upgradeTest.js`
// DEVNOTE: This approves for a EOA. Alter for any address?

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder } = require("ethers");
// const { Alchemy } = require("alchemy-sdk");

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

const proxyAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const publicAddressOwner = process.env.TESTNET_PUBLIC_KEY;
const implAddr = process.env.TESTNET_IMPLEMENTATION_HATCHER_ADDR;

// Define the contract address and the ABI (Application Binary Interface)
const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const contractABI = [
  // Minimal ABI to include only the function you need
  "function setApprovalForAll(address operator, bool approved)",
];
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

// Create a signer
const privateKey = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const signer = new ethers.Wallet(privateKey, provider);
const abiCoder = new AbiCoder(); // Add this line to create an instance of AbiCoder

async function upgradeContract() {
  console.log("begin token upgrade test!");
  const upgradeAndCallABI = [
    "function upgradeToAndCall(address newImplementation, bytes memory data) external payable",
  ];

  const proxy = new ethers.Contract(proxyAddress, upgradeAndCallABI, signer);

  // Prepare initialization data if needed
  //   const initData = someInterface.encodeFunctionData("initialize", [
  //     publicAddressOwner,
  //   ]);
  console.log("address: ", publicAddressOwner);
  const initData = abiCoder.encode(["address"], [publicAddressOwner]);

  const tx = await proxy.upgradeToAndCall(implAddr, initData);
  await tx.wait();

  console.log("after.");
}

upgradeContract();
