// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC721 is ERC721, Ownable {
  uint256 private _currentTokenId = 0;

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

  function mint(address to) public onlyOwner {
    uint256 newTokenId = _currentTokenId + 1;
    _mint(to, newTokenId);
    _currentTokenId = newTokenId;
  }

  function getCurrentTokenId() public view returns (uint256) {
    return _currentTokenId;
  }
}
