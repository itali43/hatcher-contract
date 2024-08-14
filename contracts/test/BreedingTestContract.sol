//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "../HatcherV2.sol";
import "hardhat/console.sol";

/* is HatcherV2 */
contract BreedingTestContract {
  constructor() {}

  function requestBreed(
    uint256 planetAId,
    uint256 planetBId,
    bool shouldUseMiniBlackhole
  ) external payable returns (bytes32) {
    // must send at least 0.2 ronin
    // send back bytes 32
    require(msg.value >= 0.2 ether, "Insufficient ron fee");
    uint256 meaningless = planetAId + planetBId;
    bool bh = shouldUseMiniBlackhole;
    if (bh != true) {
      console.log(meaningless);
    }
    string memory convertToBytes32 = "conjunctioncomplete";
    bytes32 converted = bytes32(bytes(convertToBytes32)); // Convert string to bytes32

    return converted;
  }
}
