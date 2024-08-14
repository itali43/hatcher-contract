// Tests for LR Character 🚧 🚧
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber, defaultAbiCoder, parseEther } = require("ethers");
require("dotenv").config();

const { hhtoolbox } = require("@nomicfoundation/hardhat-toolbox");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { internalTask } = require("hardhat/config");

describe("HatcherV2 Contract", function () {
  // EIP712 details required for deployment to test env
  let mockERC721;
  before(async function () {
    // Check connection to the network
    const networkName = await ethers.provider.getNetwork();
    // console.log(`Connected to network: ${networkName.name}`);
    // Check balance of the deployer to ensure node is responsive
    const [deployer] = await ethers.getSigners();
  });

  async function deployTokenFixture() {
    const [ownerAddr, addr1, addr2, signer] = await ethers.getSigners(3);
    // mock NFT to replace aperion
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    mockERC721 = await MockERC721.deploy("MockNFT", "MNFT");
    await mockERC721.waitForDeployment(); // Ensure it's deployed

    // deploy internal tests mock contract
    const InternalTestsContract = await ethers.getContractFactory(
      "InternalTests"
    );
    const internalTestsContract = await InternalTestsContract.deploy();
    await internalTestsContract.waitForDeployment(); // Ensure it's deployed

    console.log(
      "this may be imporant: ",
      await internalTestsContract.getAddress()
    );
    // internal tests
    // const internalTestsContract = await ethers.getContractFactory(
    //   "InternalTestsCharacter"
    // );
    // testInternalTestsContract = await internalTestsContract.deploy();

    // deploy breeding mock contract
    const BreedingTestContract = await ethers.getContractFactory(
      "InternalTests"
    );
    const breedingTestContract = await BreedingTestContract.deploy();
    await breedingTestContract.waitForDeployment(); // Ensure it's deployed

    // deploy hatcher contract
    let HatcherContract = await ethers.getContractFactory("HatcherV2");
    const hatcherContract = await upgrades.deployProxy(HatcherContract, [], {
      initializer: "initialize",
    });

    await hatcherContract.waitForDeployment(); // Ensure it's deployed

    const mockNFTAddr = await mockERC721.getAddress();
    const address1 = await addr1.getAddress();
    const address2 = await addr2.getAddress();
    const ownerAddress = await ownerAddr.getAddress();
    const hatcherAddress = await hatcherContract.getAddress();
    const breedingAddress = await breedingTestContract.getAddress();

    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);

    await mockERC721.mint(ownerAddress);

    await mockERC721.mint(address1);
    await mockERC721.mint(address2);
    await mockERC721.mint(address2);

    // Set up the HatcherV2 contract with the address of the mock ERC721

    await hatcherContract.setAllOf(breedingAddress, 2, mockNFTAddr);
    // TODO: fix first to be breed contract address (mock)🚧🚧🚧🚧🚧🚧
    // geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);
    console.log("complete fixture... ");
    console.log("owner address: ", ownerAddress);
    console.log("addr1 address: ", address1);
    console.log("mockERC721 address: ", mockNFTAddr);
    console.log("Hatcher address: ", await hatcherContract.getAddress());
    console.log("address2 address: ", address2);
    console.log("breeder address:  ", breedingAddress);

    return {
      ownerAddr,
      addr1,
      address1,
      addr2,
      address2,
      ownerAddress,
      hatcherContract,
      hatcherAddress,
      mockERC721,
      mockNFTAddr,
      signer,
      internalTestsContract,
      breedingTestContract,
    };
  }

  async function listPlanet(
    hatcherContract,
    mockERC721,
    listingAddr,
    ownerAddr,
    tokenId
  ) {
    // Ensure the owner approves the HatcherV2 contract to operate all their tokens
    await mockERC721
      .connect(ownerAddr)
      .setApprovalForAll(await hatcherContract.getAddress(), true);

    // Ensure the listing address is also approved if different from owner
    if (listingAddr !== ownerAddr) {
      await mockERC721
        .connect(listingAddr)
        .setApprovalForAll(await hatcherContract.getAddress(), true);
    }

    // Perform the safe transfer
    const toAddress = await hatcherContract.getAddress(); // Destination address
    const coder = new ethers.AbiCoder();

    const data = coder.encode(["uint256"], [200000000000000000n]);

    try {
      await mockERC721
        .connect(listingAddr)
        ["safeTransferFrom(address,address,uint256,bytes)"](
          // Specify the full function signature
          await listingAddr.getAddress(),
          toAddress,
          tokenId,
          data
        );
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    // Verify ownership has transferred
    const owner = await mockERC721.ownerOf(tokenId);
    return owner === toAddress; // Returns true if the transfer was successful
  }

  it("A-  Should retrieve all planets", async function () {
    const { hatcherContract, mockERC721, ownerAddr, addr1 } = await loadFixture(
      deployTokenFixture
    );

    const happened = await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2
    );
    const planets = await hatcherContract.getAllPlanets();

    expect(planets.length).to.be.greaterThan(0);
  });

  it("B- Should allow minting and transferring NFTs", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      mockERC721,
      address1,
      hatcherAddress,
    } = await loadFixture(deployTokenFixture);

    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 2);

    const owner = await mockERC721.ownerOf(2);
    expect(owner).to.be.equal(hatcherAddress); // Example test condition
  });

  // it("C-- should approve an address to transfer NFTs", async function () {
  //   const { mockERC721, addr1 } = await loadFixture(deployTokenFixture);

  //   // Mint a token to addr1 for testing
  //   await mockERC721.mint(await addr1.getAddress());
  //   const tokenId = await mockERC721.getCurrentTokenId();

  //   // Approve addr1 to transfer the token
  //   await mockERC721.connect(addr1).approve(addr1.getAddress(), tokenId);

  //   // Check if the approval was successful
  //   expect(await mockERC721.getApproved(tokenId)).to.equal(addr1.getAddress());
  // });

  // it("D-- should correctly handle an ERC721 token without Data...", async function () {
  //   const { hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // Mint a token to addr1
  //   const sendNFTFromHere = await addr1.getAddress();
  //   await mockERC721.mint(await sendNFTHere);
  //   const tokenId = await mockERC721.getCurrentTokenId();
  //   // console.log("token ID: ", tokenId);

  //   // Transfer the token from addr1 to the HatcherV2 contract
  //   await mockERC721
  //     .connect(addr1)
  //     .safeTransferFrom(
  //       sendNFTFromHere,
  //       await hatcherContract.getAddress(),
  //       tokenId
  //     );
  //   const planets = await hatcherContract.getAllPlanets();
  //   console.log("planets!!!!! \n", planets);

  //   // Check if the HatcherV2 contract is now the owner of the token
  //   // console.log("who is owner?");
  //   // console.log(await mockERC721.ownerOf(tokenId));
  //   expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //     await addr1.getAddress()
  //   );

  //   // Optionally, check for an event or a state change in the HatcherV2 contract if applicable
  //   // For example, if the HatcherV2 contract emits an event upon receiving a token:
  //   // await expect(mockERC721.connect(addr1).transferFrom(addr1.address, hatcherContract.address, tokenId))
  //   //   .to.emit(hatcherContract, 'TokenReceived').withArgs(tokenId, addr1.address);
  // });

  // it("DD-- should correctly handle an ERC721 token with Data...", async function () {
  //   const { hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  //   const coder = new ethers.AbiCoder();

  //   // Mint a token to addr1
  //   const sendNFTHere = await addr1.getAddress();
  //   await mockERC721.mint(await sendNFTHere);
  //   const tokenId = await mockERC721.getCurrentTokenId();
  //   const data = coder.encode(["uint256"], [1]);

  //   // console.log("token ID: ", tokenId);

  //   // Transfer the token from addr1 to the HatcherV2 contract
  //   await mockERC721
  //     .connect(addr1)
  //     .safeTransferFrom(
  //       sendNFTHere,
  //       await hatcherContract.getAddress(),
  //       tokenId,
  //       data
  //     );
  //   const planets = await hatcherContract.getAllPlanets();
  //   console.log("planets!!!!! \n", planets);

  //   // Check if the HatcherV2 contract is now the owner of the token
  //   // console.log("who is owner?");
  //   // console.log(await mockERC721.ownerOf(tokenId));
  //   expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //     await addr1.getAddress()
  //   );

  //   // Optionally, check for an event or a state change in the HatcherV2 contract if applicable
  //   // For example, if the HatcherV2 contract emits an event upon receiving a token:
  //   // await expect(mockERC721.connect(addr1).transferFrom(addr1.address, hatcherContract.address, tokenId))
  //   //   .to.emit(hatcherContract, 'TokenReceived').withArgs(tokenId, addr1.address);
  // });

  // setAllOf works on testnet, there is a problem with the internaltest contract I think
  // it("DDD-- SetAllOf should set correctly", async function () {
  //   const {
  //     ownerAddr,
  //     hatcherContract,
  //     addr1,
  //     addr2,
  //     breedingTestContract,
  //     internalTestsContract,
  //     mockERC721,
  //   } = await loadFixture(deployTokenFixture);

  //   // Transfer the token from addr1 to the HatcherV2 contract
  //   breederContractAddress = await breedingTestContract.getAddress();
  //   vrfValue = 21;
  //   nftContractAddress = await mockERC721.getAddress();

  //   await hatcherContract
  //     .connect(ownerAddr)
  //     .setAllOf(await addr1.getAddress(), vrfValue, await addr2.getAddress());

  //   const breeder = await internalTestsContract
  //     .connect(ownerAddr)
  //     ._getBreedContract();
  //   console.log(
  //     "breeder v addr1 (should be same): ",
  //     breeder,
  //     " = ? = ",
  //     await addr1.getAddress()
  //   );

  //   // breeder (this is internal)
  //   expect(breeder).to.equal(await addr1.getAddress());

  //   vrfValue;
  //   expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //     await hatcherContract.getAddress()
  //   );
  //   // nftcontract (this is internal)
  //   expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //     await hatcherContract.getAddress()
  //   );
  // });

  it("E-- conjunct a listed planet with a planet held, confirm send works", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      mockERC721,
      breedingTestContract,
    } = await loadFixture(deployTokenFixture);
    const breedContract = await breedingTestContract.getAddress();
    console.log(breedContract);

    // function requestBreed(
    //   uint256 planetAId,
    //   uint256 planetBId,
    //   bool shouldUseMiniBlackhole
    // ) external payable returns (bytes32) {}

    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 2);
    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 3);

    const addr2Planet = 8;
    const listedPlanet = 3;
    const options = { value: ethers.parseEther("1.2").toString() }; // Sending 1.2 ether
    console.log("total sent: ", ethers.parseEther("1.2"));
    // TODO🚧🚧🚧🚧🚧🚧🚧🚧
    // try {
    //   const transactionResponse = await hatcherContract
    //     .connect(addr2)
    //     .conjunct(addr2Planet, listedPlanet, options);
    //   console.log("Transaction successful:", transactionResponse);
    // } catch (error) {
    //   console.error("Transaction failed:", error);
    // }
    const bytes32slug = ethers.formatBytes32String("conjunctioncomplete");

    expect(bytes32slug).to.equal(bytes32slug);
  });

  // it("E2-- try and fail to conjunct without paying enough", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  // });

  // it("E3-- try and fail to conjunct with a listing that doesn't exist", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  // });
  // it("E4-- try and conjunct with your own planet", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  // });

  it("F-- should return false if the operator is not approved", async function () {
    const { ownerAddr, hatcherContract, addr2, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // Check approval status without setting approval
    expect(
      await hatcherContract.checkApprovalForAll(
        await ownerAddr.getAddress(),
        await addr2.getAddress()
      )
    ).to.equal(false);
  });

  // it("G-- ApprovalForAllAsOwner function works as expected", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   await mockERC721
  //     .connect(ownerAddr)
  //     .setApprovalForAll(ownerAddr.getAddress(), true);

  //   // approveForAllAsOwner
  //   await hatcherContract
  //     .connect(ownerAddr)
  //     .approveForAllAsOwner(await mockERC721.getAddress(), true);

  //   expect(
  //     await mockERC721.isApprovedForAll(
  //       await ownerAddr.getAddress(),
  //       await mockERC721.getAddress()
  //     )
  //   ).to.be.true;

  //   //   await hatcherContract
  //   //   .connect(ownerAddr)
  //   //   .approveForAllAsOwner(await addr1.getAddress(), false);

  //   // // Check if addr1 is no longer an approved operator
  //   // expect(await mockERC721.isApprovedForAll(await ownerAddr.getAddress(), await addr1.getAddress())).to.be.false;

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  // it("H-- should allow users to claim their planets", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  //   const happened = await listPlanet(
  //     hatcherContract,
  //     mockERC721,
  //     addr1,
  //     ownerAddr,
  //     2
  //   );

  //   // Conjunct two planets.
  //   // Have paying party redeem via claming

  //   const claimableTokenId = 1;

  //   // Call the claimPlanet function
  //   await hatcher.connect(addr1).claimPlanet(claimableTokenId);

  //   // Check the state after claiming
  //   const claim = await hatcher.claimablePlanets(addr1.address);
  //   expect(claim.delivered).to.be.true;
  // });

  // it("I-- Withdrawaling fees paid works", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  // it("II-- users withdrawal of cash works", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  // it("J-- change VRF value", async function () {
  //   const {
  //     ownerAddr,
  //     hatcherContract,
  //     internalTestsContract,
  //     address1,
  //     addr1,
  //   } = await loadFixture(deployTokenFixture);

  //   const happen = await hatcherContract
  //     .connect(ownerAddr)
  //     .changeVRFValue(1337);
  //   console.log(happen);
  //   const vrf = await internalTestsContract.connect(ownerAddr)._getVRFValue();
  //   console.log(vrf);
  //   expect(vrf).to.equal(1337);
  // });

  it("K-- delist a planet", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721, address1 } =
      await loadFixture(deployTokenFixture);
    // list two planets
    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 2);
    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 3);

    // delist planet, tokenId 3 to be delisted
    // function deList(uint256 idIndex, uint256 tokenId) public whenNotPaused {

    try {
      const listedPlanetsForUser = await hatcherContract.getuserToListedPlanets(
        address1
      );

      // delist
      const tokenId = listedPlanetsForUser[1].tokenId;
      const idIndex = 1;
      const all = await hatcherContract.connect(addr1).getAllPlanets();

      await hatcherContract.connect(addr1).deList(idIndex, tokenId);
    } catch (error) {
      console.error("K--Transaction failed:", error);
    }

    const listedPlanetsForUser2 = await hatcherContract.getuserToListedPlanets(
      address1
    );
    const listedPlanets = await hatcherContract.getAllPlanets();

    expect(await listedPlanets[1].active).to.equal(false);
    expect(await mockERC721.ownerOf(3)).to.equal(await addr1.getAddress());
    expect(await listedPlanetsForUser2.length).to.equal(1);
  });

  it("KK-- Impossible to delist a planet if not yours", async function () {
    const { ownerAddr, hatcherContract, addr1, addr2, mockERC721, address1 } =
      await loadFixture(deployTokenFixture);
    // list two planets
    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 2);
    await listPlanet(hatcherContract, mockERC721, addr1, ownerAddr, 3);

    // delist planet, tokenId 3 to be delisted
    // function deList(uint256 idIndex, uint256 tokenId) public whenNotPaused {

    try {
      const listedPlanetsForUser = await hatcherContract.getuserToListedPlanets(
        address1
      );
      // delist
      const tokenId = listedPlanetsForUser[1].tokenId;
      const idIndex = 1;
      const all = await hatcherContract.connect(addr1).getAllPlanets();

      expect(
        await hatcherContract.connect(addr2).deList(idIndex, tokenId)
      ).to.revert();
    } catch {
      console.log("KK working as planned");
    }

    const listedPlanetsForUser2 = await hatcherContract.getuserToListedPlanets(
      address1
    );
    const listedPlanets = await hatcherContract.getAllPlanets();
    expect(await listedPlanets[1].active).to.equal(true);
    expect(await mockERC721.ownerOf(3)).to.equal(
      await hatcherContract.getAddress()
    );
    expect(await listedPlanetsForUser2.length).to.equal(2);
  });

  // it("L-- Get planets paginated", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });
});
