// Tests for LR Character 🚧 🚧
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const {
  BigNumber,
  defaultAbiCoder,
  parseEther,
  encodeBytes32String,
  formatEther,
} = require("ethers");
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

    // internal tests
    // const internalTestsContract = await ethers.getContractFactory(
    //   "InternalTestsCharacter"
    // );
    // testInternalTestsContract = await internalTestsContract.deploy();

    // deploy breeding mock contract
    const BreedingTestContract = await ethers.getContractFactory(
      "BreedingTestContract"
    );
    const breedingTestContract = await BreedingTestContract.deploy();
    await breedingTestContract.waitForDeployment(); // Ensure it's deployed

    // deploy hatcher contract
    let HatcherContract = await ethers.getContractFactory("HatcherV2");
    const hatcherContract = await upgrades.deployProxy(
      HatcherContract,
      [await ownerAddr.getAddress()],
      {
        initializer: "initialize",
      }
    );
    // const owner = await hatcherContract.owner();
    // console.log("++>>>>>>>>OWNER:  ", owner);

    // deploy internal tests mock contract
    const InternalTestsContract = await ethers.getContractFactory(
      "InternalTests"
    );
    const internalTestsContract = await InternalTestsContract.deploy();
    await internalTestsContract.waitForDeployment(); // Ensure it's deployed

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
    await mockERC721.mint(address1); // 5

    await mockERC721.mint(ownerAddress); // 6

    await mockERC721.mint(address1);
    await mockERC721.mint(address2);
    await mockERC721.mint(address2); // 9

    // Set up the HatcherV2 contract with the address of the mock ERC721

    await hatcherContract
      .connect(ownerAddr)
      .setAllOf(breedingAddress, 200000000000000000n, mockNFTAddr);
    // TODO: fix first to be breed contract address (mock)🚧🚧🚧🚧🚧🚧
    await internalTestsContract.setAllOf(
      breedingAddress,
      200000000000000000n,
      mockNFTAddr
    );

    await hatcherContract.setMktFee(5); // 5%
    // await internalTestsContract.setMktFee(5);

    console.log("complete fixture... ");
    console.log("owner address: ", ownerAddress);
    console.log("addr1 address: ", address1);
    console.log("mockERC721 address: ", mockNFTAddr);
    console.log("Hatcher address: ", await hatcherContract.getAddress());
    console.log("address2 address: ", address2);
    console.log("breeder address:  ", breedingAddress);

    const standardPrice = "2"; // 2
    const depositPrice = "3000000000001"; // 3000000000001

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
      standardPrice,
      depositPrice,
    };
  }

  async function listPlanet(
    hatcherContract,
    mockERC721,
    listingAddr,
    ownerAddr,
    tokenId,
    price
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
    convertedPrice = ethers.parseEther(price);

    const data = coder.encode(["uint256"], [convertedPrice]);

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
    const { hatcherContract, mockERC721, ownerAddr, addr1, standardPrice } =
      await loadFixture(deployTokenFixture);

    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
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
      standardPrice,
    } = await loadFixture(deployTokenFixture);

    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );

    const owner = await mockERC721.ownerOf(2);
    expect(owner).to.be.equal(hatcherAddress);
  });

  it("D-- should correctly receive a Mint (token sent w/o Data...)", async function () {
    const {
      ownerAddr,
      hatcherContract,
      hatcherAddress,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
      address1,
    } = await loadFixture(deployTokenFixture);

    const addr2Planet = 8;
    const listedPlanet = 3;
    await breedingTestContract.requestBreed(listedPlanet, addr2Planet, false, {
      value: 2200000000000000000n,
    });
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      8,
      depositPrice
    );

    const valueToSend = ethers.parseEther("10").toString(); // Sending 1.2 ether
    console.log("total sent: ", valueToSend);

    try {
      await hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend });
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    const mintytxn = await mockERC721.mint(hatcherContract);
    await mintytxn.wait();
    expect(await mockERC721.ownerOf(10)).to.be.equal(hatcherAddress);
    // expect(
    //   await hatcherContract.getClaimantTokenIdToOwnerAddress(10)
    // ).to.be.equal(address1);
  });

  // it("DD-- should correctly receive a random NFT (do nothing)", async function () {
  //   const { hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );
  // });

  // it("DDD-- setArrivedToTrue should set arrived to true", async function () {
  //   const {
  //     hatcherContract,
  //     addr1,
  //     address1,
  //     address2,
  //     mockERC721,
  //     internalTestsContract,
  //   } = await loadFixture(deployTokenFixture);

  //   await internalTestsContract.setArrivedToTrue([address1, address2], 10);

  //   await internalTestsContract.getClaimablePlanetsFor(address2);
  // });

  it("E-- conjunct a listed planet with a planet held, confirm send works", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
    } = await loadFixture(deployTokenFixture);
    const addr2Planet = 8;
    const listedPlanet = 3;
    await breedingTestContract.requestBreed(listedPlanet, addr2Planet, false, {
      value: 2200000000000000000n,
    });
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      8,
      depositPrice
    );

    const valueToSend = ethers.parseEther("10").toString(); // Sending 1.2 ether
    console.log("total sent: ", valueToSend);

    try {
      const transactionResponse = await hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend });
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    // claimantTokenIdToOwnerAddress[yourPlanet] = userAsking;
    const claimant = await hatcherContract.getClaimantTokenIdToOwnerAddress(8);
    // const claimablePlanet = hatcherContract.getClaimablePlanetsFor(address1)

    const claimablePlanet = await hatcherContract.getClaimablePlanetsFor(
      address2
    );

    expect(claimant).to.equal(address2);
    expect(claimablePlanet[0].ownerTokenId).to.equal(addr2Planet);
  });

  it("E2-- try and fail to conjunct without depositing your own planet", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
    } = await loadFixture(deployTokenFixture);
    const addr2Planet = 8;
    const listedPlanet = 3;
    const txrtn = await breedingTestContract.requestBreed(
      listedPlanet,
      addr2Planet,
      false,
      {
        value: 2200000000000000000n,
      }
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );
    const valueToSend = ethers.parseEther("10").toString(); // Sending 1.2 ether

    const slug =
      "You need to list/deposit the planet you are trying to breed with.";
    await expect(
      hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend })
    ).to.be.revertedWith(slug);
  });

  it("E3-- try and fail to conjunct with a listing with too little money sent", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
    } = await loadFixture(deployTokenFixture);
    const addr2Planet = 8;
    const listedPlanet = 3;

    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      8,
      depositPrice
    );

    const valueToSend = ethers.parseEther("0.000000000000001").toString(); // Sending 1.2 ether
    console.log("total sent: ", valueToSend);

    const slug = "Insufficient funds to cover VRF cost and price and fee.";
    await expect(
      hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend })
    ).to.be.revertedWith(slug);
  });

  it("E4-- try and conjunct using a planet that isn't yours", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
    } = await loadFixture(deployTokenFixture);
    const addr2Planet = 2;
    const listedPlanet = 3;
    const txrtn = await breedingTestContract.requestBreed(
      listedPlanet,
      addr2Planet,
      false,
      {
        value: 2200000000000000000n,
      }
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      8,
      depositPrice
    );

    const valueToSend = ethers.parseEther("10").toString(); // Sending 10 ether
    console.log("total sent: ", valueToSend);

    const slug = "You do not own the planet you are trying to breed.";
    await expect(
      hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend })
    ).to.be.revertedWith(slug);
  });

  it("E5-- try and conjunct with your own planet", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
    } = await loadFixture(deployTokenFixture);
    const addr2Planet = 2;
    const listedPlanet = 2;
    const txrtn = await breedingTestContract.requestBreed(
      listedPlanet,
      addr2Planet,
      false,
      {
        value: 2200000000000000000n,
      }
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      3,
      depositPrice
    );

    const valueToSend = ethers.parseEther("10").toString(); // Sending 10 ether
    console.log("total sent: ", valueToSend);

    const slug = "Asexual reproduction is not allowed";
    await expect(
      hatcherContract
        .connect(addr1)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend })
    ).to.be.revertedWith(slug);
  });

  it("E6-- Does send payment to Listing user", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address2,
      mockERC721,
      standardPrice,
      breedingTestContract,
      depositPrice,
    } = await loadFixture(deployTokenFixture);

    console.log("@@@@@@@@@FIRST@@@@@@@@@@@@@@@");
    const balance4 = ethers.formatEther(
      (await addr1.provider.getBalance(await addr1.getAddress())).toString()
    );

    const balance5 = ethers.formatEther(
      (await addr2.provider.getBalance(await addr2.getAddress())).toString()
    );

    const balanceOwner6 = ethers.formatEther(
      (
        await ownerAddr.provider.getBalance(await ownerAddr.getAddress())
      ).toString()
    );

    console.log("balance addr1 original: ", balance4);

    console.log("balance addr2 original: ", balance5);
    console.log("balance Owner original: ", balanceOwner6);
    console.log("------$$-------");
    console.log(balance4 - balance5);

    const addr2Planet = 8;
    const listedPlanet = 3;
    await breedingTestContract.requestBreed(listedPlanet, addr2Planet, false, {
      value: 2200000000000000000n,
    });
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      ethers.parseEther("10").toString()
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      ethers.parseEther("10").toString()
    );

    // deposit planet
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr2,
      ownerAddr,
      8,
      depositPrice
    );

    const valueToSend = ethers.parseEther("10").toString(); // Sending 1.2 ether
    console.log("total sent: ", valueToSend);

    try {
      const transactionResponse = await hatcherContract
        .connect(addr2)
        .conjunct(addr2Planet, listedPlanet, { value: valueToSend });
    } catch (error) {
      console.error("Transaction failed:", error);
    }

    console.log("@@@@@@@@@WWWWWWWWWWWWWWWW*****************@@@@@@@@@@@@@@@");
    const balance1 = ethers.formatEther(
      (await addr1.provider.getBalance(await addr1.getAddress())).toString()
    );

    const balance2 = ethers.formatEther(
      (await addr2.provider.getBalance(await addr2.getAddress())).toString()
    );

    const balanceOwner = ethers.formatEther(
      (
        await ownerAddr.provider.getBalance(await ownerAddr.getAddress())
      ).toString()
    );

    console.log("balance addr1: ", balance1);

    console.log("balance addr2: ", balance2);
    console.log("balance Owner: ", balanceOwner);
    console.log("-------------");
    console.log(balance4 - balance1);

    expect(parseInt(balance4)).greaterThan(parseInt(balance1));
  });

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

  it("H-- should allow users to claim their planets", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      address1,
      address2,
      mockERC721,
      internalTestsContract,
      standardPrice,
    } = await loadFixture(deployTokenFixture);
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    // Conjunct two planets is simulated
    // set up dummy cPlanet.  It has arrived but is not delivered
    const arri = await internalTestsContract.arriveClaimablePlanet(
      address1,
      2,
      address2,
      8,
      10
    );
    await internalTestsContract.getClaimantTokenIdToOwnerAddress(10);
    await internalTestsContract.addClaimant(10, address1); // artificially add claimant, done in receiver normally
    await mockERC721.mint(internalTestsContract.getAddress()); // send NFT to contract
    // this normally happens in the markAsDelivered func
    await internalTestsContract.connect(addr1).claimPlanet(10); // Call the claimPlanet function

    const planetsClaimedList =
      await internalTestsContract.getClaimablePlanetsFor(address1);

    const claimed = planetsClaimedList[0].delivered;

    expect(await mockERC721.ownerOf(10)).to.equal(address1);
    expect(claimed).to.be.true;
  });

  it("HH-- should NOT allow users to claim others planets", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      address1,
      address2,
      mockERC721,
      hatcherAddress,
      internalTestsContract,
      standardPrice,
    } = await loadFixture(deployTokenFixture);
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    // Conjunct two planets is simulated
    // set up dummy cPlanet.  It has arrived but is not delivered
    const arri = await internalTestsContract.arriveClaimablePlanet(
      address1,
      2,
      address2,
      8,
      10
    );
    await internalTestsContract.getClaimantTokenIdToOwnerAddress(10);
    await internalTestsContract.addClaimant(10, address1); // artificially add claimant, done in receiver normally
    await mockERC721.mint(internalTestsContract.getAddress()); // send NFT to contract
    // this normally happens in the markAsDelivered func

    // Call the claimPlanet function, should revert
    await expect(
      internalTestsContract.connect(addr2).claimPlanet(10)
    ).to.be.revertedWith("claim must be from claimants address-- disallowed.");

    const planetsClaimedList =
      await internalTestsContract.getClaimablePlanetsFor(address1);

    const claimed = planetsClaimedList[0].delivered;

    expect(await mockERC721.ownerOf(10)).to.equal(
      await internalTestsContract.getAddress()
    );
    expect(claimed).to.be.false;
  });

  it("HHH-- should NOT allow users to claim ALREADY Delivered planets", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      address1,
      address2,
      addr2,
      mockERC721,
      internalTestsContract,
      standardPrice,
    } = await loadFixture(deployTokenFixture);
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    // Conjunct two planets is simulated
    // console.log("then.. ", await mockERC721.getCurrentTokenId());
    // set up dummy cPlanet.  It has arrived but is not delivered
    const arri = await internalTestsContract.arriveClaimablePlanet(
      address1,
      2,
      address2,
      8,
      10
    );
    await internalTestsContract.getClaimantTokenIdToOwnerAddress(10);
    await internalTestsContract.addClaimant(10, address1); // artificially add claimant, done in receiver normally
    await mockERC721.mint(internalTestsContract.getAddress()); // send NFT to contract
    // this normally happens in the markAsDelivered func
    await internalTestsContract.connect(addr1).claimPlanet(10); // Call the claimPlanet function

    const planetsClaimedList =
      await internalTestsContract.getClaimablePlanetsFor(address1);

    const claimed = planetsClaimedList[0].delivered;

    expect(await mockERC721.ownerOf(10)).to.equal(address1);
    expect(claimed).to.be.true;

    await expect(
      internalTestsContract.connect(addr1).claimPlanet(10)
    ).to.be.revertedWith("Failed to send NFT. Check Claimant TokenId sent");
  });

  // it("I-- Withdrawaling fees paid works", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  it("K-- delist a planet", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      mockERC721,
      address1,
      standardPrice,
    } = await loadFixture(deployTokenFixture);
    // list two planets
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );

    try {
      const listedPlanetsForUser = await hatcherContract.getuserToListedPlanets(
        address1
      );

      // delist
      const tokenId = listedPlanetsForUser[1].tokenId;
      const idIndex = 1;
      await hatcherContract.connect(addr1).getAllPlanets();

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
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      addr2,
      mockERC721,
      address1,
      standardPrice,
    } = await loadFixture(deployTokenFixture);
    // list two planets
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      2,
      standardPrice
    );
    await listPlanet(
      hatcherContract,
      mockERC721,
      addr1,
      ownerAddr,
      3,
      standardPrice
    );
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
