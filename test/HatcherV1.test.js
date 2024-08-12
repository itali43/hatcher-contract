// Tests for LR Character 🚧 🚧
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber, defaultAbiCoder } = require("ethers");
require("dotenv").config();

const { hhtoolbox } = require("@nomicfoundation/hardhat-toolbox");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HatcherV2 Contract", function () {
  // EIP712 details required for deployment to test env
  let mockERC721;
  before(async function () {
    // Check connection to the network
    const networkName = await ethers.provider.getNetwork();
    // console.log(`Connected to network: ${networkName.name}`);
    // Check balance of the deployer to ensure node is responsive
    const [deployer] = await ethers.getSigners();
    // console.log("deployer addr: ", deployer.address);
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

    // console.log("Deployed MockERC721 at:", await mockERC721.getAddress());

    // setup mock breeding contract.
    // ---TO DO---
    // breedcontract[address] = "0xjfqoiwe340g3n0bn9w9bn9bw9b9nnan93442";
    // set up mock coordinator
    let HatcherContract = await ethers.getContractFactory("HatcherV2");
    // console.log(",,,,,,, ", HatcherContract);
    // deploy hatcher contract
    const hatcherContract = await upgrades.deployProxy(HatcherContract, [], {
      initializer: "initialize",
    });

    await hatcherContract.waitForDeployment(); // Ensure it's deployed

    // console.log("Deployed: ", hatcherContract);

    const mockNFTAddr = await mockERC721.getAddress();
    const address1 = await addr1.getAddress();
    const address2 = await addr2.getAddress();
    const ownerAddress = await ownerAddr.getAddress();
    const hatcherAddress = await hatcherContract.getAddress();

    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);
    await mockERC721.mint(address1);

    await mockERC721.mint(ownerAddress);

    // Set up the HatcherV2 contract with the address of the mock ERC721
    // console.log("mockNFTAddr again: ", mockNFTAddr);

    await hatcherContract.setAllOf(mockNFTAddr, 2, mockNFTAddr);
    // TODO: fix first to be breed contract address (mock)🚧🚧🚧🚧🚧🚧
    // geni = ethers.utils.defaultAbiCoder.encode(["bool"], [false]);
    console.log("complete fixture... ");

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
    };
  }

  it("A-  should retrieve all planets", async function () {
    const { hatcherContract } = await loadFixture(deployTokenFixture);

    const planets = await hatcherContract.getAllPlanets();
    // console.log("planets! \n", planets);
    expect(planets.length).to.be.greaterThan(0); // Example test condition
  });

  // it("should emit a DebugLog event when sending token", async function () {
  //   const { hatcherContract, addr1, mockERC721, address1, hatcherAddress } =
  //     await loadFixture(deployTokenFixture);
  //   const coder = new ethers.AbiCoder();

  //   const data = coder.encode(["uint256"], [1]);

  //   const txResponse = await mockERC721
  //     .connect(addr1)
  //     .safeTransferFrom(addr1.address, hatcherContract.address, 0, data);
  //   const debugEvent = receipt.logs.find((log) => log.event === "DebugLog");
  //   console.log(
  //     debugEvent.args.message,
  //     debugEvent.args.from,
  //     debugEvent.args.value.toString()
  //   );
  // });

  it("B-  should allow minting and transferring NFTs", async function () {
    const {
      ownerAddr,
      hatcherContract,
      addr1,
      mockERC721,
      address1,
      hatcherAddress,
    } = await loadFixture(deployTokenFixture);
    const tokenId = await mockERC721.getCurrentTokenId();
    // console.log(tokenId);
    // Approve and transfer the token from addr1 to the HatcherV2 contract
    await mockERC721
      .connect(ownerAddr)
      .setApprovalForAll(await addr1.getAddress(), true);
    // const ownerAddress = await mockERC721.owner();

    // approve address to send tokenid
    await mockERC721.connect(addr1).approve(await addr1.getAddress(), tokenId);

    const coder = new ethers.AbiCoder();
    const data = coder.encode(["uint256"], [1]);
    const abi = [
      // Include only the necessary part of the ABI for the function you want to call
      "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    ];
    const contract = new ethers.Contract(
      await mockERC721.getAddress(),
      abi,
      ownerAddr
    );
    const fromAddress = await ownerAddr.getAddress(); // currently, owner addr, should be independent
    const toAddress = await hatcherContract.getAddress(); // Destination address

    console.log(hatcherContract.nftContractAddress);

    try {
      const txResponse = await contract.safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        data
      );
      const receipt = await txResponse.wait();
      console.log("---------------------------------------_))))))");
      console.log(await receipt.events);
      console.log("---------------------------------------_))))))");

      const nftReceivedEvent = receipt.events.find(
        (event) => event.event === "NftReceived"
      );
      if (nftReceivedEvent) {
        console.log("NFT Received:", nftReceivedEvent.args);
      } else {
        console.log("no event received");
      }

      console.log("Transaction successful:", receipt);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
    const owner = await mockERC721.ownerOf(tokenId);
    console.log(owner);

    // await expect(eventEmitter.emitMyEventWithData(42, "foo"))
    // .to.emit(eventEmitter, "MyEventWithData")
    // .withArgs(42, "foo");

    expect(owner).to.be.equal(hatcherAddress); // Example test condition
    // expect(listing.owner).to.equal(addr1.address);
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

  // ===================================================================
  // ===================================================================
  // ===================================================================
  // ===================================================================
  // ===================================================================
  // ===================================================================

  // it("SetAllOf should set correctly", async function () {
  //   const { ownerAddr, hatcherContract, addr1, addr2 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // // Transfer the token from addr1 to the HatcherV2 contract
  //   // breederContractAddr = await addr1.getAddress();
  //   // vrfValue = 200;
  //   // nftContractAddr = await addr2.getAddress();

  //   // await hatcherContract
  //   //   .connect(ownerAddr)
  //   //   .setAllOf(breederContractAddr, vrfValue, nftContractAddr);

  //   // breeder = await hatcherContract
  //   //   .connect(ownerAddr)
  //   //   .console.log("breeder: ", breeder, " = = = ", await addr1.getAddress());

  //   // breeder (this is internal)
  //   // expect(await hatcherContract.connect(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   //     );

  //   // vrfValue
  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  //   // // nftcontract (this is internal)
  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  it("E-- should return true if the operator is approved for all", async function () {
    const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
      deployTokenFixture
    );

    // Owner approves addr1 for all NFTs
    await hatcherContract
      .connect(ownerAddr)
      .approveForAllAsOwner(await mockERC721.getAddress(), true);

    // Check approval status
    console.log();
    expect(
      await hatcherContract.checkApprovalForAll(
        await ownerAddr.getAddress(),
        await mockERC721.getAddress()
      )
    ).to.equal(true);
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

  // ===================================================================
  // ===========================also========================================
  // ===================================================================

  // it("New func", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  // it("New func", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

  // it("New func", async function () {
  //   const { ownerAddr, hatcherContract, addr1, mockERC721 } = await loadFixture(
  //     deployTokenFixture
  //   );

  //   // expect(await mockERC721.ownerOf(tokenId)).to.equal(
  //   //   await hatcherContract.getAddress()
  //   // );
  // });

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

  //       await mockERC721.connect(addr1).approve(hatcherV2.address, tokenId);

  //       await expect(
  //         await hatcherV2
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
