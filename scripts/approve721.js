// approve721.js
// `npx hardhat run --network saigon scripts/approve721.js`

const { ethers, JsonRpcProvider } = require("ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const hatcherAddr = process.env.TESTNET_PROXY_HATCHER_ADDR;

async function approveAllERC721TokensTask(
  contractAddress,
  tokenAddress,
  operator,
  signer
) {
  const hatcherV2ABI = [
    "function approveAllERC721Tokens(address token, address operator)",
  ];

  // Create a contract instance
  const hatcherV2 = new ethers.Contract(contractAddress, hatcherV2ABI, signer);

  // Approve the operator to use all ERC721 tokens
  const transaction = await hatcherV2.approveAllERC721Tokens(
    tokenAddress,
    operator
  );
  await transaction.wait();

  console.log(`Approval transaction successful: ${transaction.hash}`);
}

// Usage example
async function main() {
  const provider = new JsonRpcProvider(process.env.SAIGON_URL);
  const privateKey = PRIVATE_KEY; // Be cautious with private keys
  const signer = new ethers.Wallet(privateKey, provider);

  const contractAddress = hatcherAddr;
  const tokenAddress = process.env.TESTNET_PLANET_NFT_CONTRACT_ADDRESS; // ERC721 token address
  const operator = process.env.MANAGER_CONTRACT_ADDRESS; // Operator address

  await approveAllERC721TokensTask(
    contractAddress,
    tokenAddress,
    operator,
    signer
  );
}

main().catch(console.error);

// const { ethers, JsonRpcProvider, parseUnits } = require("ethers");
// require("dotenv").config();

// const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT; //TESTNET_PRIVATE_KEY;
// const MGR_ADDR = process.env.MANAGER_CONTRACT_ADDRESS;
// const ANIMA_ADDR = process.env.ANIMA_CONTRACT_ADDRESS;
// const APRS_ADDR = process.env.APRS_CONTRACT_ADDRESS;
// const hatcherAddr = process.env.TESTNET_PROXY_HATCHER_ADDR;

// // solidity
// // function approveAllERC721Tokens(
// //     IERC721 token,
// //     address operator
// //   ) public onlyOwner whenNotPaused {
// //     token.setApprovalForAll(operator, true);
// //   }

// async function approveERC721(
//   contractAddress,
//   tokenAddress,
//   spender,
//   amount,
//   signer
// ) {
//   const hatcherV2ABI = [
//     "function approveAllERC721Tokens(IERC721 token, address operator)"
// ];

//   const tokenABI = [
//     "function approveAllERC721Tokens(IERC721 token, address operator)"
// ];

//   // Create a contract instance
//   const hatcherV2 = new ethers.Contract(contractAddress, hatcherV2ABI, signer);

//   // Approve the spender to use the ERC20 tokens
//   const transaction = await hatcherV2.approveERC20(
//     tokenAddress,
//     spender,
//     amount
//   );
//   await transaction.wait();

//   console.log(`Approval transaction successful: ${transaction.hash}`);
// }

// // Usage example
// async function main() {
//   const provider = new JsonRpcProvider(process.env.SAIGON_URL);
//   const privateKey = PRIVATE_KEY; // Be cautious with private keys
//   const signer = new ethers.Wallet(privateKey, provider);

//   const contractAddress = hatcherAddr;
//   const amount = ethers.parseUnits("10000000", 18); // 100 tokens, assuming 18 decimal places

//   await approveERC20(contractAddress, APRS_ADDR, MGR_ADDR, amount, signer);
//   await approveERC20(contractAddress, ANIMA_ADDR, MGR_ADDR, amount, signer);
// }

// main().catch(console.error);
