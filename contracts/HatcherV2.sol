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

import "hardhat/console.sol";

interface IERC721 {
  function transferFrom(address from, address to, uint256 tokenId) external;
  function ownerOf(uint256 tokenId) external view returns (address);
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes calldata data
  ) external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
  function isApprovedForAll(
    address owner,
    address operator
  ) external view returns (bool);

  function getPlanetData(
    uint256 tokenId
  ) external view returns (PlanetData memory, bool);
  function setApprovalForAll(address operator, bool approved) external;
}

interface IBreedContract {
  function requestBreed(
    uint256 planetAId,
    uint256 planetBId,
    bool shouldUseMiniBlackhole
  ) external payable returns (bytes32);
}

struct ListedPlanet {
  uint256 tokenId;
  uint256 price;
  address ownerAddress;
  bool active;
}

struct ClaimablePlanet {
  address ownerParentAddress;
  uint256 ownerTokenId;
  bool delivered; // to user
  bool arrived; // from breed in smart contract
  address otherParent;
  uint256 otherTokenId;
  uint256 claimsTokenId;
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
contract HatcherV2 is
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
  event DeClaimedAPlanet(address sentToUser, address token, uint256 tokenId);

  event PlanetsConjoining(
    uint256 planetAsking,
    address askingUser,
    uint256 planetJoining,
    address joiningUser
  );

  IBreedContract public breedContract;

  address payable private treasuryAddr;

  IERC721 nftPlanetContract;

  uint256 vrfValue;

  mapping(address => ListedPlanet[]) public userToListedPlanets;

  ListedPlanet[] planetsListed;

  /// @notice error given if user other than minter tries to use forbidden funcs
  error Unauthorized();

  // claimable tokenID -> address
  mapping(uint256 => address) public claimantTokenIdToOwnerAddress;
  // users to planets owed after conjunction
  mapping(address => ClaimablePlanet[]) public claimablePlanets;

  uint256 mktFee;

  // getter functions
  function getClaimablePlanetsFor(
    address userAddr
  ) public view returns (ClaimablePlanet[] memory) {
    return claimablePlanets[userAddr];
  }

  function getClaimantTokenIdToOwnerAddress(
    uint256 claimableTokenId
  ) public view returns (address) {
    return claimantTokenIdToOwnerAddress[claimableTokenId];
  }

  function getuserToListedPlanets(
    address userAddr
  ) public view returns (ListedPlanet[] memory) {
    return userToListedPlanets[userAddr];
  }

  /// @notice Checks if a specific claimable planet has arrived
  /// @param owner The address of the owner of the claimable planet
  /// @param tokenId The token ID of the claimable planet
  /// @return arrived A boolean indicating if the planet has arrived
  function hasPlanetArrived(
    address owner,
    uint256 tokenId
  ) public view returns (bool arrived) {
    ClaimablePlanet[] storage planets = claimablePlanets[owner];
    for (uint i = 0; i < planets.length; i++) {
      if (planets[i].claimsTokenId == tokenId) {
        return planets[i].arrived;
      }
    }
    revert("Planet not found");
  }

  /// @notice Checks if a specific claimable planet has been delivered
  /// @param owner The address of the owner of the claimable planet
  /// @param tokenId The token ID of the claimable planet
  /// @return delivered A boolean indicating if the planet has been delivered
  function hasPlanetBeenDelivered(
    address owner,
    uint256 tokenId
  ) public view returns (bool delivered) {
    ClaimablePlanet[] storage planets = claimablePlanets[owner];
    for (uint i = 0; i < planets.length; i++) {
      if (planets[i].claimsTokenId == tokenId) {
        return planets[i].delivered;
      }
    }
    revert("Planet not found");
  }

  /// @param newTAdd the address that the owner would like the new URI to be
  function setTAdd(address payable newTAdd) public onlyOwner whenNotPaused {
    treasuryAddr = newTAdd;
  }

  /// @notice function should be run after deployment to set up defaults
  function setAllOf(
    address _breederContractAddr,
    uint256 _vrfValue,
    address _nftContractAddr
  ) public virtual onlyOwner whenNotPaused {
    vrfValue = _vrfValue;
    breedContract = IBreedContract(_breederContractAddr);
    nftPlanetContract = IERC721(_nftContractAddr);
  }

  function setMktFee(uint256 _toThisPercentage) public onlyOwner {
    mktFee = _toThisPercentage;
  }

  // /// @custom:oz-upgrades-unsafe-allow constructor
  // constructor() {
  //   _disableInitializers();
  // }

  /// @notice Initialization of contract, called upon deployment
  /// @dev implements EIP712, is upgradeable, pausable, burn function is custom to save space
  function initialize(address initialOwner) public initializer {
    __Ownable_init();
    __Pausable_init();
    // __ERC1155Burnable_init();
    __UUPSUpgradeable_init();
    transferOwnership(initialOwner);

    // PaymentSplitterUpgradeable(_payees, _shares);
  }

  function changeVRFValue(uint256 newVRF) public onlyOwner whenNotPaused {
    vrfValue = newVRF;
  }

  function list(uint256 tokenId, uint256 price, address ownerAddress) internal {
    // make sure it is approved for all before!
    //  add to userToListedPlanets

    ListedPlanet memory newPlanetToList = ListedPlanet(
      tokenId,
      price,
      ownerAddress,
      true
    );

    planetsListed.push(newPlanetToList);

    userToListedPlanets[ownerAddress].push(newPlanetToList);

    emit ListedAPlanet(msg.sender, address(nftPlanetContract), tokenId, price);
  }

  function usersClaims(
    address userAddress
  ) public view returns (ClaimablePlanet[] memory) {
    return claimablePlanets[userAddress];
  }

  function ownerClaimPlanet(
    uint256 claimableTokenId,
    address sendToAddr
  ) public onlyOwner whenNotPaused {
    address userThatCanClaim = claimantTokenIdToOwnerAddress[claimableTokenId];

    // send new planet to owner
    _sendNFT(claimableTokenId, userThatCanClaim);

    // // mark claim as delivered
    markAsDelivered(claimableTokenId);

    // emit accomplishment
    emit DeClaimedAPlanet(
      sendToAddr,
      address(nftPlanetContract),
      claimableTokenId
    );
  }

  function claimPlanet(uint256 claimableTokenId) public whenNotPaused {
    address user = msg.sender;
    address userThatCanClaim = claimantTokenIdToOwnerAddress[claimableTokenId];
    if (userThatCanClaim != user) {
      console.log(userThatCanClaim);
      console.log(user);
      revert("claim must be from claimants address-- disallowed.");
    }
    console.log("--NFT-- Ctid, then user");
    console.log(claimableTokenId);
    console.log(user);
    bool success = _sendNFT(claimableTokenId, user);
    if (!success) {
      revert("Failed to send NFT. Check Claimant TokenId sent");
    }
    // mark claim as delivered
    markAsDelivered(claimableTokenId);

    // emit accomplishment
    emit DeClaimedAPlanet(user, address(nftPlanetContract), claimableTokenId);
  }

  function markAsDelivered(uint256 claimableTokenId) internal {
    address owner = claimantTokenIdToOwnerAddress[claimableTokenId];
    ClaimablePlanet[] storage planets = claimablePlanets[owner];
    for (uint i = 0; i < planets.length; i++) {
      if (planets[i].claimsTokenId == claimableTokenId) {
        planets[i].delivered = true;
        break;
      }
    }
  }

  // function removeElement(
  //   uint256 index,
  //   ClaimablePlanet[] memory array
  // ) internal pure returns (ClaimablePlanet[] memory) {
  //   require(index < array.length, "Index out of bounds");

  //   ClaimablePlanet[] memory newArray = new ClaimablePlanet[](array.length - 1);
  //   for (uint256 i = 0; i < index; i++) {
  //     newArray[i] = array[i];
  //   }
  //   for (uint256 i = index; i < newArray.length; i++) {
  //     newArray[i] = array[i + 1];
  //   }
  //   return newArray;
  // }

  // mark arrived on CPlanet struct and that's that
  function setArrivedToTrue(
    address[2] memory parents,
    uint256 tokenId
  ) internal virtual {
    address parentA = parents[0];
    address parentB = parents[1];
    // if (parentA != address(0)) {}  // possibly a better solution TODO

    if (claimablePlanets[parentA].length > 0) {
      // it is likely parent 0, confirm:
      for (uint i = 0; i < claimablePlanets[parentA].length; i++) {
        if (claimablePlanets[parentA][i].otherParent == parentB) {
          // confirmed, change delivery status and set claim nft's tokenId
          claimablePlanets[parentA][i].arrived = true;
          claimablePlanets[parentA][i].claimsTokenId = tokenId;
        }
      }
    } else if (claimablePlanets[parents[1]].length > 0) {
      // must be parent 1
      for (uint i = 0; i < claimablePlanets[parentB].length; i++) {
        if (claimablePlanets[parentB][i].otherParent == parentA) {
          // confirmed, change delivery status and set claim nft's tokenId
          claimablePlanets[parentB][i].arrived = true;
          claimablePlanets[parentB][i].claimsTokenId = tokenId;
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
    // sent 721 has data and is from the planet contract (safetransferfrom)
    if (data.length > 0 && msg.sender == address(nftPlanetContract)) {
      uint256 priceData = abi.decode(data, (uint256));
      list(tokenId, priceData, from);
      emit NftReceived(operator, from, tokenId, data, "listing planet");
    } else if (
      // if no data, but still planet, should be a mint
      msg.sender == address(nftPlanetContract)
    ) {
      // minted from breed contract, send to claimable planets, first get parents
      (PlanetData memory newPlanetData, ) = nftPlanetContract.getPlanetData(
        tokenId
      );
      // check who the planet's parents are
      uint256[] memory parentsIDs = newPlanetData.parents;
      uint256 claimableTokenId = tokenId;
      // lookup + package addresses from Parent TokenIDs
      address addressParentA = claimantTokenIdToOwnerAddress[parentsIDs[0]];
      address addressParentB = claimantTokenIdToOwnerAddress[parentsIDs[1]];
      address[2] memory parents = [addressParentA, addressParentB];

      // see description, sets arrived to true, user can now have it delivered
      setArrivedToTrue(parents, claimableTokenId);

      // Emit an event with details about the NFT received
      emit NftReceived(operator, from, tokenId, data, "new planet");
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
  function deList(uint256 idIndex, uint256 tokenId) public whenNotPaused {
    require(idIndex < planetsListed.length, "Index out of bounds");

    address user = msg.sender;
    ListedPlanet memory planetToDeList = planetsListed[idIndex];

    if (msg.sender != planetToDeList.ownerAddress) {
      revert();
    }
    // clear from planetsListed
    // zero out the array listing, this does not change the array keys
    planetsListed[idIndex] = ListedPlanet({
      tokenId: planetToDeList.tokenId,
      price: 0,
      ownerAddress: planetToDeList.ownerAddress,
      active: false
    });

    // delist on mapping
    // this solution keeps the array cleaner but moves keys around
    userToListedPlanets[msg.sender];
    userToListedPlanets[msg.sender][idIndex] = userToListedPlanets[msg.sender][
      userToListedPlanets[msg.sender].length - 1
    ];
    userToListedPlanets[msg.sender].pop();

    // send planet back to owner
    _sendNFT(tokenId, user);

    // emit accomplishment
    emit DeListedAPlanet(
      user,
      address(nftPlanetContract),
      planetToDeList.tokenId
    );
  }

  function deListAllYourPlanets() public {
    // make sure it is approved for all
    // sort how many planets
    // remove each to listedPlanets
  }

  function priceOfListingRetrieval(
    uint256 tokenIdOfListedToken
  ) internal view whenNotPaused returns (uint256 priceOfListing) {
    for (uint i = 0; i < planetsListed.length; i++) {
      // seek out price
      if (planetsListed[i].tokenId == tokenIdOfListedToken) {
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
  ) public payable whenNotPaused {
    // make sure approval for all for (anima + aprs + nfts) before use
    require(
      yourPlanet != withListedPlanet,
      "Asexual reproduction is not allowed"
    );

    uint256 price = priceOfListingRetrieval(withListedPlanet);
    address yourPlanetLocation = IERC721(nftPlanetContract).ownerOf(yourPlanet);
    require(
      yourPlanetLocation == address(this),
      "You need to list/deposit the planet you are trying to breed with."
    );

    // confirm the owner of the `ownerOfYourPlanet`
    address payable ownerOfYourPlanet;
    uint256 yourTokenId;
    for (uint i = 0; i < planetsListed.length; i++) {
      if (planetsListed[i].tokenId == yourPlanet) {
        ownerOfYourPlanet = payable(planetsListed[i].ownerAddress);
        yourTokenId = planetsListed[i].tokenId;
        break;
      }
    }
    require(
      ownerOfYourPlanet == msg.sender,
      "You do not own the planet you are trying to breed."
    );
    uint fee = (price * mktFee) / 100;

    require(
      msg.value >= vrfValue + price + fee,
      "Insufficient funds to cover VRF cost and price and fee."
    );
    address userAsking = msg.sender;
    // can have this fail at breeder contract level or hatcher level.  commented out = breeder level
    // if (msg.value < vrfValue) {
    //       revert();
    // }
    // pay the owner of withListedPlanet
    // First, find the owner of the `withListedPlanet`
    address payable ownerOfListedPlanet;
    uint256 otherTokenId;
    for (uint i = 0; i < planetsListed.length; i++) {
      if (planetsListed[i].tokenId == withListedPlanet) {
        ownerOfListedPlanet = payable(planetsListed[i].ownerAddress);
        otherTokenId = planetsListed[i].tokenId;
        break;
      }
    }
    // amount to send, minus service fee to Hatcher of 5%

    // Send Ether to the owner of the listed planet
    require(
      address(this).balance >= 0.5 ether,
      "Contract has Insufficient balance, contact hatcher hq"
    );
    bool sent = ownerOfListedPlanet.send(price);
    require(sent, "Failed to send Ether");

    // breed the planets
    breedContract.requestBreed{ value: vrfValue }(
      yourPlanet,
      withListedPlanet,
      false
    );

    // breed call did not fail, list to claimable planets
    ClaimablePlanet memory newClaimable = ClaimablePlanet({
      ownerParentAddress: userAsking,
      ownerTokenId: yourPlanet,
      delivered: false,
      arrived: false,
      otherParent: ownerOfListedPlanet,
      otherTokenId: otherTokenId,
      claimsTokenId: 0
    });
    // list claimble planet.
    claimablePlanets[userAsking].push(newClaimable);
    // Once Breed/VRF returns it, arrived will be set to true

    // add user so they can be looked up via tokenid
    claimantTokenIdToOwnerAddress[yourPlanet] = userAsking;

    if (msg.value > vrfValue + price + fee) {
      (bool refunded, ) = msg.sender.call{
        value: msg.value - vrfValue - price - fee
      }("");
      require(refunded, "Failed to refund excess Ether");
    }

    // if listed planet is out of bondings, delist it

    //emit conjunction
    emit PlanetsConjoining(
      yourPlanet,
      userAsking,
      withListedPlanet,
      ownerOfListedPlanet
    );
  }

  function _sendNFT(uint256 _tokenId, address _to) internal returns (bool) {
    try nftPlanetContract.safeTransferFrom(address(this), _to, _tokenId) {
      return true;
    } catch {
      return false;
    }
  }

  function ownerOverrideSendNFT(
    uint256 tokenId,
    address destinationAddr
  ) public onlyOwner {
    nftPlanetContract.transferFrom(address(this), destinationAddr, tokenId);
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
  // function approveForAllAsOwner(
  //   address operator,
  //   bool approved
  // ) public onlyOwner {
  //   nftPlanetContract.setApprovalForAll(operator, approved);
  // }

  function checkApprovalForAll(
    address owner,
    address operator
  ) public view returns (bool) {
    return nftPlanetContract.isApprovedForAll(owner, operator);
  }

  /// @notice Allow Owner to withdraw of MATIC from the contract
  /// @dev utility function only, shouldn't need to be used.
  function withdrawFunds() public onlyOwner whenNotPaused {
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
  receive() external payable override {}
  fallback() external payable {}
}
