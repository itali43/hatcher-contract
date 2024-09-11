// ownerClaim.js
// `npx hardhat run --network saigon scripts/ownerClaim.js`

require("dotenv").config();

const { ethers, JsonRpcProvider, AbiCoder, parseEther } = require("ethers");
const {} = ethers;

// CHANGE BELOW TO LIST PLANET!
// const listedPlanet = 471; // <-- CHANGE!
const myPlanet = 6560;
// Hatcher Contract
const hatcherContractAddress = process.env.TESTNET_PROXY_HATCHER_ADDR;
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;
const userAddress = process.env.TESTNET_SIGNER_PUBLIC_KEY;
const provider = new JsonRpcProvider(process.env.SAIGON_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const contractABI = [
  "function conjunct(uint256 yourPlanet,uint256 withListedPlanet) public payable",
  "function getAllPlanets() public view returns (tuple(uint256 tokenId, uint256 price, address ownerAddress, bool active)[] memory)",
  "function getClaimablePlanetsFor(address userAddr) public view returns (tuple(uint256 tokenId, uint256 price, address ownerAddress, bool active)[] memory)",
  "function claimPlanet(uint256 claimableTokenId) public",
  "function getClaimantTokenIdToOwnerAddress(uint256 claimableTokenId) public view returns (address)",
  "function ownerClaimPlanet(uint256 claimableTokenId,address sendToAddr) public",
];

// Connect to your contract
const hatcherContract = new ethers.Contract(
  hatcherContractAddress,
  contractABI,
  signer
);

async function ownerClaimPlanet() {
  //listedPlanetId, walletPlanetId) {

  const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY_TRADFORMAT;

  // provider - ronin
  // const provider = new ethers.providers.JsonRpcProvider(process.env.SAIGON_URL);
  const provider = new JsonRpcProvider(process.env.SAIGON_URL);

  // Setup provider and wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Assuming the ABI and contract address are set in your environment
  const contract = new ethers.Contract(
    hatcherContractAddress,
    contractABI,
    wallet
  );

  try {
    const txnClaimant = await hatcherContract
      .connect(signer)
      .ownerClaimPlanet(myPlanet, userAddress);

    console.log(txnClaimant);
    console.log("Transaction hash:", txnClaimant.hash);
    await tx.wait();
    console.log("Planet claimed successfully");
  } catch (error) {
    console.error("Failed to delist planet:", error);
  }
}

ownerClaimPlanet();
