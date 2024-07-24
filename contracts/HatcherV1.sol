// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IERC721 {
  function transferFrom(address from, address to, uint256 tokenId) external;
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes calldata data
  ) external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;

  function getPlanetData(
    uint256 tokenId
  ) external view returns (PlanetData memory, bool);
  function setApprovalForAll(address operator, bool approved) external;
}

interface IBreedContract {
  function requestBreed(
    uint256 planetAId,
    uint256 planetBId,
    bool shouldUseMiniBlackhole,
    uint value
  ) external payable returns (bytes32);
}

struct ListedPlanet {
  uint256 planet;
  uint256 price;
  address ownerAddress;
}

struct ClaimablePlanet {
  address ownerParentAddress;
  uint256 ownerTokenId;
  bool delivered;
  address otherParent;
  uint256 otherTokenId;
}

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

/// @title HatcherGG
/// @author Caecus
/// @notice This contract allows for escrowed NFT breeding
/// @dev Contract is liable to be updated without warning
/// @dev Homo faber suae quisque fortunae
/// @custom:security-contact security@earnalliance.com
contract HatcherV1 is
  Initializable,
  PausableUpgradeable,
  UUPSUpgradeable,
  EIP712Upgradeable,
  ERC20PermitUpgradeable,
  PaymentSplitterUpgradeable,
  IERC721ReceiverUpgradeable,
  OwnableUpgradeable
{
  using AddressUpgradeable for address payable;

  event NftReceived(
    address operator,
    address from,
    uint256 tokenId,
    bytes data,
    string typeOfReceival
  );
  event ListedAPlanet(
    address sentFromUser,
    address token,
    uint256 tokenId,
    uint256 price
  );
  event DeListedAPlanet(address sentToUser, address token, uint256 tokenId);

  event PlanetsConjoining(
    uint256 planetAsking,
    address askingUser,
    uint256 planetJoining,
    address joiningUser
  );

  IBreedContract breedContract;

  address payable private treasuryAddr;

  IERC721 nftPlanetContract;

  uint256 vrfValue;

  mapping(address => ListedPlanet[]) public userToListedPlanets;

  ListedPlanet[] planetsListed;

  // claimable tokenID -> address
  mapping(uint256 => address) public claimableTokenIdToOwnerAddress;
  // users to planets owed after conjunction
  mapping(address => ClaimablePlanet[]) public claimablePlanets;

  /// @notice error given if user other than minter tries to use forbidden funcs
  error Unauthorized();

  /// @notice set URI.  Where metadata and images will come from per tokenId
  /// @param newTAdd the address that the owner would like the new URI to be
  function setTAdd(address payable newTAdd) public onlyOwner {
    treasuryAddr = newTAdd;
  }

  /// @notice function should be run after deployment to set up defaults
  function setAllOf(
    address _breederContractAddr,
    uint256 _vrfValue,
    address _nftContractAddr
  ) public onlyOwner {
    vrfValue = _vrfValue;
    breedContract = IBreedContract(_breederContractAddr);
    nftPlanetContract = IERC721(_nftContractAddr);
  }

  // /// @custom:oz-upgrades-unsafe-allow constructor
  // constructor() {
  //   _disableInitializers();
  // }

  /// @notice Initialization of contract, called upon deployment
  /// @dev implements EIP712, is upgradeable, pausable, burn function is custom to save space
  function initialize() public initializer {
    __Ownable_init();
    __Pausable_init();
    // __ERC1155Burnable_init();
    __UUPSUpgradeable_init();
    // PaymentSplitterUpgradeable(_payees, _shares);
  }

  function changeVRFValue(uint256 newVRF) public onlyOwner {
    vrfValue = newVRF;
  }

  function list(uint256 tokenId, uint256 price, address ownerAddress) internal {
    // make sure it is approved for all before! maybe during contract creation or right after prob better / more chill
    //  add to userToListedPlanets

    // ListedPlanet memory newPlanetToList = ListedPlanet(tokenId, price, ownerAddress);
    // ListedPlanet[] currentUserLP = userToListedPlanets[ownerAddress];

    ListedPlanet memory newPlanetToList = ListedPlanet(
      tokenId,
      price,
      ownerAddress
    );
    userToListedPlanets[ownerAddress].push(newPlanetToList);

    // add to planetsListed
    planetsListed.push(newPlanetToList);

    emit ListedAPlanet(msg.sender, address(nftPlanetContract), tokenId, price);
  }

  // test each address, one should have a claimable planet with the other being it's otherParent
  // for loop thru claimable planets
  // once address key hit, for loop thru those CPlanets checking otherParent for match
  // mark delivered on CPlanet struct and that's that
  function setDeliveryToTrue(address[2] memory parents) internal {
    address parentA = parents[0];
    address parentB = parents[1];

    if (claimablePlanets[parentA].length > 0) {
      // it is likely parent 0, confirm:
      for (uint i = 0; i < claimablePlanets[parentA].length; i++) {
        if (claimablePlanets[parentA][i].otherParent == parentB) {
          // confirmed, change delivery status
          claimablePlanets[parentA][i].delivered = true;
        }
      }
    } else if (claimablePlanets[parents[1]].length > 0) {
      // must be parent 1
      for (uint i = 0; i < claimablePlanets[parentB].length; i++) {
        if (claimablePlanets[parentB][i].otherParent == parentA) {
          // confirmed, change delivery status
          claimablePlanets[parentB][i].delivered = true;
        }
      }
    } else {
      revert("planet sent errantly, no one to claim");
    }
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes memory data
  ) public override returns (bytes4) {
    // if new planet arrives
    if (msg.sender == address(0) && operator == address(nftPlanetContract)) {
      // get parents
      (PlanetData memory newPlanetData, ) = nftPlanetContract.getPlanetData(
        tokenId
      );

      // check who the planet's parents are
      uint256[] memory parentsIDs = newPlanetData.parents;

      // lookup addresses from Parent TokenIDs
      address addressParentA = claimableTokenIdToOwnerAddress[parentsIDs[0]];
      address addressParentB = claimableTokenIdToOwnerAddress[parentsIDs[1]];

      // package addresses
      address[2] memory parents = [addressParentA, addressParentB];
      // see description, sets deliverable to true.
      setDeliveryToTrue(parents);
      // Emit an event with details about the NFT received
      emit NftReceived(operator, from, tokenId, data, "new planet");
    } else if (data.length > 0 && operator == address(nftPlanetContract)) {
      uint256 priceData = abi.decode(data, (uint256));
      list(tokenId, priceData, from);
      // Perform operations based on the decoded data
      // Emit an event with details about the NFT received
      emit NftReceived(operator, from, tokenId, data, "listing planet");
    } else {
      // Emit an event with details about the NFT received
      emit NftReceived(operator, from, tokenId, data, "uncategorized");
    }

    return IERC721ReceiverUpgradeable.onERC721Received.selector;
  }

  // get planets by page, saves gas
  function getPlanetsPaginated(
    uint startIndex,
    uint endIndex
  ) public view returns (ListedPlanet[] memory) {
    require(endIndex > startIndex, "Invalid index");
    require(endIndex <= planetsListed.length, "Index out of bounds");

    ListedPlanet[] memory page = new ListedPlanet[](endIndex - startIndex);
    for (uint i = startIndex; i < endIndex; i++) {
      page[i - startIndex] = planetsListed[i];
    }
    return page;
  }

  // get all planets from array
  function getAllPlanets() public view returns (ListedPlanet[] memory) {
    return planetsListed;
  }

  function listAllYourPlanets() public {
    // make sure it is approved for all
    // sort how many planets
    // add each to listedPlanets
  }
  function deList(uint256 idIndex, uint256 tokenId) public {
    require(idIndex < planetsListed.length, "Index out of bounds");

    address user = msg.sender;
    ListedPlanet memory planetToDeList = planetsListed[idIndex];
    // move out of escrow
    // subtract to listedPlanets
    // ensure owner or planet owner

    if (msg.sender != planetToDeList.ownerAddress /*|| owner*/) {
      revert();
    }

    // this solution keeps the array cleaner but moves keys around
    // opted for alt solution b/c keeps keys intact
    // planetsListed[idIndex] = planetsListed[planetsListed.length - 1];
    // planetsListed.pop();

    // zero out the array listing, this does not change the array keys
    planetsListed[idIndex] = ListedPlanet({
      planet: 0,
      price: 0,
      ownerAddress: address(0)
    });

    // delist on mapping

    // send planet back to owner
    _sendNFT(tokenId, user);

    // emit accomplishment
    emit DeListedAPlanet(
      user,
      address(nftPlanetContract),
      planetToDeList.planet
    );
  }

  function deListAllYourPlanets() public {
    // make sure it is approved for all
    // sort how many planets
    // remove each to listedPlanets
  }

  function priceOfListingRetrieval(
    uint256 tokenIdOfListedToken
  ) internal view returns (uint256) {
    for (uint i = 0; i < planetsListed.length; i++) {
      // seek out price
      if (planetsListed[i].planet == tokenIdOfListedToken) {
        return planetsListed[i].price;
      }

      // if no price found, give infinite for fail.
      if (i == (planetsListed.length - 1)) {
        return type(uint256).max;
      }
    }
  }

  // @notice: Conjunction functions takes a listed planet and a initiating user's planet and makes a breed request
  // @dev: must send 0.2 RON along with, such that VRF can operate
  // @param yourPlanet the planet user intends to breed
  // @param withListedPlanet the planet user intends to breed with
  function conjunct(
    uint256 yourPlanet,
    uint256 withListedPlanet
  ) public payable {
    // make sure approval for all for (anima + aprs + nfts) before use
    address userAsking = address(0);

    address joiningUser = address(0);
    uint256 price = priceOfListingRetrieval(withListedPlanet);

    // can have this fail at breeder contract level or hatcher level.  commented out = breeder level
    // if (msg.value < vrfValue) {
    //       revert();
    // }

    // check if covers vrf value and price
    if (msg.value < vrfValue + price) {
      revert();
    }
    // check if both planets are presently held TODO

    // pay the owner of withListedPlanet
    // First, find the owner of the `withListedPlanet`
    address payable ownerOfListedPlanet;
    for (uint i = 0; i < planetsListed.length; i++) {
      if (planetsListed[i].planet == withListedPlanet) {
        ownerOfListedPlanet = payable(planetsListed[i].ownerAddress);
        break;
      }
    }
    // amount to send
    uint256 amountToSend = 11; //withListedPlanet price

    // Send Ether to the owner of the listed planet
    (bool sent, ) = ownerOfListedPlanet.call{ value: amountToSend }("");
    require(sent, "Failed to send Ether");

    // breed the planets
    breedContract.requestBreed(yourPlanet, withListedPlanet, false, msg.value);

    if (msg.value > vrfValue + amountToSend) {
      (bool refunded, ) = msg.sender.call{
        value: msg.value - vrfValue - amountToSend
      }("");
      require(refunded, "Failed to refund excess Ether");
    }

    // if listed planet is out of bondings, delist it

    //emit conjunction
    emit PlanetsConjoining(
      yourPlanet,
      userAsking,
      withListedPlanet,
      joiningUser
    );
  }

  function _sendNFT(uint256 _tokenId, address _to) internal {
    nftPlanetContract.transferFrom(address(this), _to, _tokenId);
  }

  function status() public onlyOwner {
    _pause();
  }

  /// @notice pause any token transfers including mints and burns
  /// @dev can only be called by owner
  function pause() public onlyOwner {
    _pause();
  }

  /// @notice unpause any token transfers including mints and burns
  /// @dev can only be called by owner
  function unpause() public onlyOwner {
    _unpause();
  }

  // Function to set approval for all tokens owned by the owner to another address
  function approveForAllAsOwner(
    address operator,
    bool approved
  ) public onlyOwner {
    nftPlanetContract.setApprovalForAll(operator, approved);
  }

  /// @notice Allow Owner to withdraw of MATIC from the contract
  /// @dev utility function only, shouldn't need to be used.
  function withdrawFunds() public onlyOwner {
    address payable to = payable(msg.sender);
    to.transfer(address(this).balance);
  }

  /// @notice called to authorize Upgrades by owner only
  /// @dev used to upgrade
  /// @param newImplementation new implementation
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  // unnecessary due to erc20Permit
  // receive() external payable {}
}
