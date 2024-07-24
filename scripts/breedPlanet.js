// breedPlanet.js
// `npx hardhat run --network saigon scripts/breedPlanet.js`

require("dotenv").config();

const { ethers, JsonRpcProvider } = require("ethers");

const contractAddress = "0x9bb139eed8df70e33da5c4e64df528ceefed46e0";

const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const planetOwned = 118;
const planetListed = 6545;
// THIS IS THE ADDRESS OF THE OPERATOR YOU'RE APPROVING, SELECT ACCORDINGLY FROM ABOVE

// Connect to the Ethereum network
// provider - ronin
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

const signer = new ethers.Wallet(PRIVATE_KEY, provider); // must be owner of contract
// Define the contract address and the ABI (Application Binary Interface)

const contractABI = [
  // Minimal ABI to include only the function you need
  "function conjunct(uint256 yourPlanet, uint256 withListedPlanet)",
];
// Connect to your contract
const contract = new ethers.Contract(contractAddress, contractABI, signer);

async function conjunct() {
  console.log("owner: ", signer.address);
  console.log(
    "conjuncting for: my ",
    planetOwned,
    " and listed ",
    planetListed
  );
  try {
    // Call the setAllOf function with the new value
    const tx = await contract.conjunct(planetOwned, planetListed);
    console.log("Transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error:", error);
  }
}

conjunct();
