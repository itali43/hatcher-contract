// withdrawal.js
// `npx hardhat run --network saigon scripts/withdrawal.js`

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder, parseEther } = require("ethers");
const {} = ethers;

const hatcherContractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const userAddress = process.env.TESTNET_SIGNER_PUBLIC_KEY;

async function main() {
  const provider = new JsonRpcProvider(process.env.SAIGON_URL);

  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Withdrawing from HatcherV2 with account:", signer.address);
  const contractABI = ["function withdrawFunds() public"];

  // Connect to your contract
  const hatcherContract = new ethers.Contract(
    hatcherContractAddress,
    contractABI,
    signer
  );

  try {
    const tx = await hatcherContract.connect(signer).withdrawFunds();
    console.log("Withdrawal transaction sent:", tx.hash);
    await tx.wait();
    console.log("Withdrawal successful");
  } catch (error) {
    console.error("Error during withdrawal:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
