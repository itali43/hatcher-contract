// conjunct.js
// `npx hardhat run --network saigon scripts/conjunct.js`

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder, parseEther } = require("ethers");
const {} = ethers;

// CHANGE BELOW TO LIST PLANET!
// 10, 11, 118, 5019, 5025, 5026, 6545, 6556, 6557, 6560, 3418 3423, 5020, 6542;
const listedPlanet = 3423; // <-- CHANGE!
const myPlanet = 6557;
const roninToSend = "0.311";
// Hatcher Contract
const hatcherContractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const userAddress = process.env.TESTNET_SIGNER_PUBLIC_KEY;
// provider - ronin
// const provider = new ethers.providers.JsonRpcProvider(process.env.SAIGON_URL);
const provider = new JsonRpcProvider(process.env.SAIGON_URL);

const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const senderAddress = signer.address;

const contractABI = [
  "function conjunct(uint256 yourPlanet,uint256 withListedPlanet) public payable",
  "function getAllPlanets() public view returns (tuple(uint256 tokenId, uint256 price, address ownerAddress, bool active)[] memory)",

  // other functions and events...
];

// Connect to your contract
const hatcherContract = new ethers.Contract(
  hatcherContractAddress,
  contractABI,
  signer
);

async function conjunctPlanets() {
  //listedPlanetId, walletPlanetId) {
  try {
    console.log("Fetching all planets...");

    const planets = await hatcherContract.getAllPlanets();
    console.log(
      "Breeding ",
      myPlanet,
      " from your wallet with ",
      listedPlanet,
      "located on the contract."
    );

    const additionalRonin = ethers.parseEther(roninToSend);
    const conjunction = await hatcherContract.orphanClaims();

    console.log("no fails, ", additionalRonin, " RON was spent/sent..");
    console.log("-----------------------result-----------------------");
    console.log("hash: ", conjunction.hash);

    return conjunction;
  } catch (error) {
    console.error("Error fetching all planets:", error);
  }
}

conjunctPlanets(); //listedPlanetId, walletPlanetId);
