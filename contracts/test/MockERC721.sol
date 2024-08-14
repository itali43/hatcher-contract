// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MockERC721 is ERC721, Ownable {
  uint256 private _currentTokenId = 0;
  event DebugLog(string message, address indexed from, uint256 value);

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
