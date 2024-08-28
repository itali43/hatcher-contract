// approve20.js
// `npx hardhat run --network saigon scripts/approve20.js`

const { ethers, JsonRpcProvider, parseUnits } = require("ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT; //TESTNET_PRIVATE_KEY;
const MGR_ADDR = process.env.MANAGER_CONTRACT_ADDRESS;
const ANIMA_ADDR = process.env.ANIMA_CONTRACT_ADDRESS;
const APRS_ADDR = process.env.APRS_CONTRACT_ADDRESS;
const hatcherAddr = process.env.TESTNET_PROXY_HATCHER_ADDR;

// solidity
// function approveERC20(IERC20 token, address spender, uint256 amount) public {
//     require(token.approve(spender, amount), "ERC20 approve failed");
// }

async function approveERC20(
  contractAddress,
  tokenAddress,
  spender,
  amount,
  signer
) {
  const hatcherV2ABI = [
    "function approveERC20(address token, address spender, uint256 amount)",
  ];

  const tokenABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  // Create a contract instance
  const hatcherV2 = new ethers.Contract(contractAddress, hatcherV2ABI, signer);

  // Approve the spender to use the ERC20 tokens
  const transaction = await hatcherV2.approveERC20(
    tokenAddress,
    spender,
    amount
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
  const amount = ethers.parseUnits("10000000", 18); // 100 tokens, assuming 18 decimal places

  await approveERC20(contractAddress, APRS_ADDR, MGR_ADDR, amount, signer);
  await approveERC20(contractAddress, ANIMA_ADDR, MGR_ADDR, amount, signer);
}

main().catch(console.error);
