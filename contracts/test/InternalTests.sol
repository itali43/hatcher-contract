//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../HatcherV2.sol";
import "hardhat/console.sol";

contract InternalTests is HatcherV2 {
  constructor() {}

  function setAllOf(
    address _breederContractAddr,
    uint256 _vrfValue,
    address _nftContractAddr
  ) public override whenNotPaused {
    vrfValue = _vrfValue;
    breedContract = IBreedContract(_breederContractAddr);
    nftPlanetContract = IERC721(_nftContractAddr);
  }

  function addClaimant(uint256 _claimTokenId, address _claimAddr) public {
    claimantTokenIdToOwnerAddress[_claimTokenId] = _claimAddr;
  }

  // simulate a token arriving without using recievedERC721
  function arriveClaimablePlanet(
    address userAsking,
    uint256 askingPlanet,
    address otherParent,
    uint256 otherTokenId,
    uint256 cTokenId
  ) public {
    ClaimablePlanet memory newClaimable = ClaimablePlanet({
      ownerParentAddress: userAsking,
      ownerTokenId: askingPlanet,
      delivered: false,
      arrived: true,
      otherParent: otherParent,
      otherTokenId: otherTokenId,
      claimsTokenId: cTokenId
    });
    // list claimble planet.
    claimablePlanets[userAsking].push(newClaimable);
  }

  // simulate a token being delivered (done with) without using recievedERC721
  function deliverClaimablePlanet(
    address userAsking,
    uint256 askingPlanet,
    address otherParent,
    uint256 otherTokenId,
    uint256 cTokenId
  ) public {
    ClaimablePlanet memory newClaimable = ClaimablePlanet({
      ownerParentAddress: userAsking,
      ownerTokenId: askingPlanet,
      delivered: true,
      arrived: true,
      otherParent: otherParent,
      otherTokenId: otherTokenId,
      claimsTokenId: cTokenId
    });
    // list claimble planet.
    claimablePlanets[userAsking].push(newClaimable);
  }

  // //   function _getTreasuryAddr() public returns (address) {
  // //     return treasuryAddr;
  // //   }

  // function _getBreedContract() public view returns (address) {
  //   console.log(hatcher.breedContract());
  //   return hatcher.breedContract();
  // }

  // function _getNFTContract() public view returns (address) {
  //   return address(hatcher.nftPlanetContract);
  // }

  // function _getVRFValue() public view returns (uint256) {
  //   return hatcher.vrfValue;
  // }
}
