// Tests for LR Character 🚧 🚧
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
require("dotenv").config();

const { hhtoolbox } = require("@nomicfoundation/hardhat-toolbox");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HatcherV1 Contract", function () {
  // EIP712 details required for deployment to test env
  let mockERC721;
  before(async function () {
    // Check connection to the network
    const networkName = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${networkName.name}`);
    // Check balance of the deployer to ensure node is responsive
    const [deployer] = await ethers.getSigners();
    console.log("deployer addr: ", deployer.address);
    // const balance = await deployer.balance();
    // console.log(balance);

    // console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);
  });

  async function deployTokenFixture() {
    const [ownerAddr, addr1, addr2, signer] = await ethers.getSigners(3);
    // console.log("ooo: ", ownerAddr);
    // mock NFT to replace aperion
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    mockERC721 = await MockERC721.deploy("MockNFT", "MNFT");
    await mockERC721.waitForDeployment(); // Ensure it's deployed

    console.log("Deployed MockERC721 at:", await mockERC721.getAddress());

    // setup mock breeding contract.
    // ---TO DO---
    // breedcontract[address] = "0xjfqoiwe340g3n0bn9w9bn9bw9b9nnan93442";
    // set up mock coordinator
    let HatcherContract = await ethers.getContractFactory("HatcherV1");
    // console.log(",,,,,,, ", HatcherContract);
    // deploy hatcher contract
    hatcherContract = await upgrades.deployProxy(HatcherContract, [], {
      initializer: "initialize",
    });

    await hatcherContract.waitForDeployment(); // Ensure it's deployed

    // console.log("Deployed: ", hatcherContract);

    const mockNFTAddr = await mockERC721.getAddress();
    // Set up the HatcherV1 contract with the address of the mock ERC721
    console.log("mockNFTAddr again: ", mockNFTAddr);

    await hatcherContract.setAllOf(mockNFTAddr, 123, mockNFTAddr);
    // TODO: fix first to be breed contract address (mock)🚧🚧🚧🚧🚧🚧
    // geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);
    console.log("complete fixture... ");

    return {
      ownerAddr,
      addr1,
      addr2,
      hatcherContract,
      mockERC721,
      signer,
    };
  }

  it("should correctly handle received ERC721 tokens", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );
    // console.log("o: ", ownerAddr.address);

    // console.log(mockERC721);
    // Mint a token to addr1
    const sendNFTHere = await addr1.getAddress();
    await mockERC721.mint(await sendNFTHere);
    const tokenId = await mockERC721.getCurrentTokenId();
    // console.log("token ID: ", tokenId);

    // Transfer the token from addr1 to the HatcherV1 contract
    await mockERC721
      .connect(addr1)
      .transferFrom(sendNFTHere, await hatcherContract.getAddress(), tokenId);

    // Check if the HatcherV1 contract is now the owner of the token
    // console.log("who is owner?");
    // console.log(await mockERC721.ownerOf(tokenId));
    expect(await mockERC721.ownerOf(tokenId)).to.equal(
      await hatcherContract.getAddress()
    );

    // Optionally, check for an event or a state change in the HatcherV1 contract if applicable
    // For example, if the HatcherV1 contract emits an event upon receiving a token:
    // await expect(mockERC721.connect(addr1).transferFrom(addr1.address, hatcherContract.address, tokenId))
    //   .to.emit(hatcherContract, 'TokenReceived').withArgs(tokenId, addr1.address);
  });

  it("SetAllOf should set correctly", async function () {
    const { ownerAddr, hatcherContract, addr1, addr2 } = await loadFixture(
      deployTokenFixture
    );

    // // Transfer the token from addr1 to the HatcherV1 contract
    // breederContractAddr = await addr1.getAddress();
    // vrfValue = 200;
    // nftContractAddr = await addr2.getAddress();

    // await hatcherContract
    //   .connect(ownerAddr)
    //   .setAllOf(breederContractAddr, vrfValue, nftContractAddr);

    // breeder = await hatcherContract
    //   .connect(ownerAddr)
    //   .console.log("breeder: ", breeder, " = = = ", await addr1.getAddress());

    // breeder (this is internal)
    // expect(await hatcherContract.connect(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    //     );

    // vrfValue
    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
    // // nftcontract (this is internal)
    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
  });

  it("should return true if the operator is approved for all", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // Owner approves addr1 for all NFTs
    await hatcherContract
      .connect(ownerAddr)
      .setApprovalForAll(await mockERC721.getAddress(), true);

    // Check approval status
    expect(
      await hatcherContract.checkApprovalForAll(
        await ownerAddr.getAddress(),
        await mockERC721.getAddress()
      )
    ).to.equal(true);
  });

  it("should return false if the operator is not approved", async function () {
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

  it("ApprovalForAllAsOwner function works as expected", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );
    // approveForAllAsOwner
    await hatcherContract
      .connect(ownerAddr)
      .approveForAllAsOwner(await mockERC721.getAddress(), true);

    expect(
      await mockERC721.isApprovedForAll(
        await ownerAddr.getAddress(),
        await mockERC721.getAddress()
      )
    ).to.be.true;

    //   await hatcherContract
    //   .connect(ownerAddr)
    //   .approveForAllAsOwner(await addr1.getAddress(), false);

    // // Check if addr1 is no longer an approved operator
    // expect(await mockERC721.isApprovedForAll(await ownerAddr.getAddress(), await addr1.getAddress())).to.be.false;

    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
  });

  it("New func", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
  });

  it("New func", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
  });

  it("New func", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // expect(await mockERC721.ownerOf(tokenId)).to.equal(
    //   await hatcherContract.getAddress()
    // );
  });

  // approve all works
  // withdrawal works
  // change VRF value
  // get planets paginated
  // delist!
  // conjunct!
  // pause / unpause actually works

  //   // //////////////  Begin Tests  //////////////
  //     it("should allow minting and transferring NFTs", async function () {
  //       const { hatcherContract, addr1, ownerAddr } = await loadFixture(
  //         deployTokenFixture
  //       );

  //       await mockERC721.mint(addr1.address);
  //       const tokenId = await mockERC721.getCurrentTokenId();

  //       await mockERC721.connect(addr1).approve(hatcherV1.address, tokenId);

  //       await expect(
  //         await hatcherV1
  //           .connect(addr1)
  //           .list(tokenId, ethers.utils.parseEther("1"), addr1.address)
  //       );
  //     });

  //   it("ownerCharacterMint works appropriately", async function () {
  //     const { hatcherContract, addr1, ownerAddr } = await loadFixture(
  //       deployTokenFixture
  //     );
  //     anotherHash = ethers.utils.hexlify(
  //       "0x4c6e6a49546269e06defcff571164816f792ea9f943f0128db2896280447ec25"
  //     );
  //     geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);

  //     const charReq = {
  //       params: geni,
  //       amount: 1,
  //       toAddress: addr1.address,
  //       nonce: anotherHash,
  //       maxCollectionSupply: 50000,
  //       valuePayable: 3,
  //     };

  //     // mint should emit
  //     await expect(
  //       await hatcherContract.connect(ownerAddr).ownerCharacterMint(charReq)
  //     ).to.emit(hatcherContract, "RequestSent");
  //   });

  //   it("Contract won't mint while paused.", async function () {
  //     const { hatcherContract, addr1, signer, ownerAddr, types } =
  //       await loadFixture(deployTokenFixture);
  //     // precursors for signature for mint
  //     const domain = {
  //       name: "earnalliance.com",
  //       version: "1",
  //       chainId: 0,
  //       verifyingContract: hatcherContract.address,
  //     };

  //     anotherHash = ethers.utils.hexlify(
  //       "0x6c3e040000000000000000000000000000000000000000000000000000000000"
  //     );

  //     geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);

  //     const data = {
  //       params: geni,
  //       amount: 1,
  //       toAddress: addr1.address,
  //       nonce: anotherHash,
  //       maxCollectionSupply: 50,
  //       valuePayable: 3,
  //     };

  //     const sig = await signer._signTypedData(domain, types, data);
  //     const sigSplit = ethers.utils.splitSignature(sig);

  //     const pause = await hatcherContract.connect(ownerAddr).pause();
  //     // mint should emit
  //     await expect(
  //       hatcherContract
  //         .connect(addr1)
  //         .tokenMint(data, sigSplit.r, sigSplit.s, sigSplit.v)
  //     ).to.be.revertedWith("Pausable: paused");
  //   });
});
