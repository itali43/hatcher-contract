// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

struct PlanetData {
  uint256 gene;
  uint256 baseAge;
  uint256 evolve;
  uint256 breedCount;
  uint256 breedCountMax;
  uint256 createTime; // before hatch
  uint256 bornTime; // after hatch
  uint256 lastBreedTime;
  uint256[] relicsTokenIDs;
  uint256[] parents; //parent token ids
  uint256[] children; //children token ids
}

contract MockERC721 is ERC721, Ownable {
  uint256 private _currentTokenId = 0;
  event DebugLog(string message, address indexed from, uint256 value);

  PlanetData mockPlanetData =
    PlanetData({
      gene: 123456789,
      baseAge: 100,
      evolve: 1,
      breedCount: 0,
      breedCountMax: 5,
      createTime: 1234567890123456789, // Current block timestamp as creation time
      bornTime: 0, // To be set when the planet "hatches"
      lastBreedTime: 0, // To be set when the planet breeds
      relicsTokenIDs: new uint256[](0), // Empty array, to be filled with token IDs of relics
      parents: new uint256[](2), // Initialize with empty dynamic array of size 2
      children: new uint256[](0) // Empty array, to be filled with children token IDs
    });

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    transferOwnership(msg.sender);
  }

  function mint(address to) public onlyOwner {
    uint256 newTokenId = _currentTokenId + 1;
    _mint(to, newTokenId);
    _currentTokenId = newTokenId;
  }

  function getCurrentTokenId() public view returns (uint256) {
    return _currentTokenId;
  }

  function getPlanetData(
    uint256 tokenId
  ) external returns (PlanetData memory, bool) {
    mockPlanetData.parents[0] = 11;
    mockPlanetData.parents[1] = 12;

    return (mockPlanetData, true);
  }

  // Override safeTransferFrom to handle data explicitly
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public override {
    emit DebugLog("sent token:", to, tokenId); // Emitting event with values
    super.safeTransferFrom(from, to, tokenId, data);
    // Custom logic can be added here if needed, for example:
    // emit TransferWithData(from, to, tokenId, data);
  }

  // Override the approve function to add custom logic or events
  function approve(address to, uint256 tokenId) public override {
    require(_exists(tokenId), "ERC721: approval query for nonexistent token");
    require(
      ownerOf(tokenId) == _msgSender() ||
        isApprovedForAll(ownerOf(tokenId), _msgSender()),
      "ERC721: approve caller is not owner nor approved for all!"
    );

    super.approve(to, tokenId);
  }
  // Override the setApprovalForAll function to add custom logic or events
  function setApprovalForAll(address operator, bool approved) public override {
    require(operator != msg.sender, "ERC721: approve to caller");

    super.setApprovalForAll(operator, approved);
  }
}
