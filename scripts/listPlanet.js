// breedPlanet.js
// `npx hardhat run --network saigon scripts/listPlanet.js`

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder } = require("ethers");
const {} = ethers;

// CHANGE BELOW TO LIST PLANET!
const planetListing = 11; //6545; //5025,5026,6556,6557; // <-- CHANGE!
const price = 1;
// Hatcher Contract
const contractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const NFT_ADDR = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS;
const HATCHER_ADDR = process.env.TESTNET_PROXY_HATCHER_ADDR;

const tokenId = planetListing; // The token ID you want to transfer

const receiverContractAddress = contractAddress;

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;

// provider - ronin
// const provider = new ethers.providers.JsonRpcProvider(process.env.SAIGON_URL);
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const senderAddress = signer.address;

// Define the contract address and the ABI (Application Binary Interface)
const contractABI = [
  // Minimal ABI to include only the function you need
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
];
// Connect to your contract
const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);

async function listPlanet() {
  ////// approve owner of NFT to send ----------------------
  // const nftContractABI = [
  //   "function setApprovalForAll(address operator, bool approved)",
  // ];
  // const nftContract = new ethers.Contract(NFT_ADDR, nftContractABI, signer);
  // try {
  //   const approvalTx = await nftContract.setApprovalForAll(NFT_ADDR, true);
  //   console.log(
  //     "Approval transaction sent. Transaction hash:",
  //     approvalTx.hash
  //   );
  //   const receipt = await approvalTx.wait();
  //   console.log(
  //     "Approval transaction confirmed in block:",
  //     receipt.blockNumber
  //   );
  // } catch (error) {
  //   console.error("Error during approval:", error);
  // }

  // approve interaction of signer with NFT contract
  try {
    const nftContractABI = [
      "function setApprovalForAll(address operator, bool approved)",
      "function approve(address to, uint256 tokenId)",
      "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    ];

    const nftContract = new ethers.Contract(NFT_ADDR, nftContractABI, signer);
    const txApproval = await nftContract.approve(HATCHER_ADDR, planetListing);
    console.log(
      "Approval transaction sent. Transaction hash:",
      txApproval.hash
    );
  } catch (error) {
    console.error("Error during approval:", error);
  }

  ////// above required for first listing ---------------------

  const gasLimit = 50000000; // Example gas limit, adjust as needed

  const abiCoder = new AbiCoder(); // Add this line to create an instance of AbiCoder

  // const encodedPrice = defaultAbiCoder.encode(["uint256"], [price]);
  // const encodedPrice = defaultAbiCoder.encode(["uint256"], [price]);
  const encodedPrice = abiCoder.encode(["uint256"], [price]);

  console.log(
    "Listing:  planet #",
    planetListing,
    "\n at price of: ",
    price,
    ", encoded as: ",
    encodedPrice,
    "\n by: ",
    signer.address
  );

  // address operator,
  // address from,
  // uint256 tokenId,
  // bytes memory data

  try {
    console.log(encodedPrice, "<---------- THIS IS ENCODED PRICE");
    const nftContractABI = [
      "function setApprovalForAll(address operator, bool approved)",
      "function approve(address to, uint256 tokenId)",
      "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    ];

    const nftContract = new ethers.Contract(NFT_ADDR, nftContractABI, signer);

    const tx = await nftContract.safeTransferFrom(
      senderAddress,
      receiverContractAddress,
      tokenId,
      encodedPrice,
      { gasLimit: gasLimit, gasPrice: 20000000000 }
    );
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error during token transfer:", error);
    if (error.data && error.data.message) {
      console.error("Revert reason:", error.data.message);
    }
  }

  // try {
  //   // Execute safeTransferFrom with data
  //   const tx = await tokenContract.safeTransferFrom(
  //     senderAddress,
  //     receiverContractAddress,
  //     tokenId,
  //     encodedPrice,
  //     { gasLimit: gasLimit } // Add this line to specify the gas limit
  //   );
  //   console.log("Transaction hash:", tx.hash);

  //   // Wait for the transaction to be confirmed
  //   const receipt = await tx.wait();
  //   console.log("Transaction confirmed in block:", receipt.blockNumber);
  // } catch (error) {
  //   console.error("Error during token transfer:", error);
  // }
}

listPlanet();
