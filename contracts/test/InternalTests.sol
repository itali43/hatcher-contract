//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../HatcherV2.sol";
import "hardhat/console.sol";

contract InternalTests is HatcherV2 {
  constructor() {}

  //   function _getTreasuryAddr() public returns (address) {
  //     return treasuryAddr;
  //   }

  function _getBreedContract() public view returns (address) {
    console.log(address(breedContract));
    return address(breedContract);
  }

  function _getNFTContract() public view returns (address) {
    return address(nftPlanetContract);
  }

  function _getVRFValue() public view returns (uint256) {
    return vrfValue;
  }
}
