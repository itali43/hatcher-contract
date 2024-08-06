// conjoin.js
// `npx hardhat run --network saigon scripts/conjoin.js`

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder } = require("ethers");
const {} = ethers;

// CHANGE BELOW TO LIST PLANET!
const listedPlanetId = 3344; // <-- CHANGE!
const walletPlanetId = 1271;
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
  "function conjoin(uint256 listedPlanetId, uint256 walletPlanetId) public",
  "event PlanetConjoined(uint256 listedPlanetId, uint256 walletPlanetId)",
  "function getAllPlanets() public view returns (uint256[] memory)",

  // other functions and events...
];

// Connect to your contract
const hatcherContract = new ethers.Contract(
  hatcherContractAddress,
  contractABI,
  signer
);

async function conjoinPlanets() {
  //listedPlanetId, walletPlanetId) {
  try {
    console.log("Fetching all planets...");

    const planets = await hatcherContract.getAllPlanets();
    console.log("All planets:", planets);

    return planets;
  } catch (error) {
    console.error("Error fetching all planets:", error);
  }

  // try {
  // console.log(`Conjoining planet ${listedPlanetId} with ${walletPlanetId}`);
  //
  // const tx = await hatcherContract.conjoin(listedPlanetId, walletPlanetId, {
  //   gasLimit: 5000000,
  // });
  // console.log("Transaction hash:", tx.hash);
  //
  // // Listen for the event
  // hatcherContract.once(
  //   "PlanetConjoined",
  //   (listedPlanetId, walletPlanetId) => {
  //     console.log(
  //       `PlanetConjoined event fired: ${listedPlanetId} conjoined with ${walletPlanetId}`
  //     );
  //   }
  // );
  //
  //   const receipt = await tx.wait();
  //   console.log("Transaction confirmed in block:", receipt.blockNumber);
  // } catch (error) {
  //   console.error("Error during conjoining planets:", error);
  // }
}

conjoinPlanets(); //listedPlanetId, walletPlanetId);
