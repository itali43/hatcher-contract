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
  console.log("gets here");
  before(async function () {
    // Check connection to the network
    const networkName = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${networkName.name}`);
    // Check balance of the deployer to ensure node is responsive
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.getBalance();
    console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);
  });

  async function deployTokenFixture() {
    const [ownerAddr, addr1, addr2, signer] = await ethers.getSigners(3);

    // mock NFT to replace aperion
    // const MockERC721 = await ethers.getContractFactory("MockERC721");
    // mockERC721 = await MockERC721.deploy("MockNFT", "MNFT");
    // await mockERC721.deployed();

    // setup mock breeding contract.
    // ---TO DO---
    breedcontract[address] = "0xjfqoiwe340g3n0bn9w9bn9bw9b9nnan93442";
    // set up mock coordinator
    let hatcherContract = await ethers.getContractFactory("HatcherV1");

    // deploy hatcher contract
    hatcherContract = await upgrades.deployProxy(
      LastRemainsCharacterContract,
      [],
      {
        initializer: "initialize",
      }
    );

    // Set up the HatcherV1 contract with the address of the mock ERC721
    await hatcherContract.setAllOf(breed.address, 123, mockERC721.address);

    // geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);
    return {
      ownerAddr,
      addr1,
      addr2,
      hatcherContract,
      signer,
    };
  }

  // //////////////  Begin Tests  //////////////
  //   it("should allow minting and transferring NFTs", async function () {
  //     const { hatcherContract, addr1, ownerAddr } = await loadFixture(
  //       deployTokenFixture
  //     );

  //     await mockERC721.mint(addr1.address);
  //     const tokenId = await mockERC721.getCurrentTokenId();

  //     await mockERC721.connect(addr1).approve(hatcherV1.address, tokenId);

  //     await expect(
  //       await hatcherV1
  //         .connect(addr1)
  //         .list(tokenId, ethers.utils.parseEther("1"), addr1.address)
  //     );
  //   });

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
