//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../HatcherV2.sol";

contract InternalTests is HatcherV2 {
  constructor() {}

  //   function _getTreasuryAddr() public returns (address) {
  //     return treasuryAddr;
  //   }

  function _getBreedContract() public view returns (address) {
    return address(breedContract);
  }

  function _getNFTContract() public view returns (address) {
    return address(nftPlanetContract);
  }

  function _getVRFValue() public view returns (uint256) {
    return vrfValue;
  }
}
