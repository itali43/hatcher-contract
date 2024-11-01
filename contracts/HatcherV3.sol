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
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
contract HatcherV3 is
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

  event Orphaning(
    address parentA,
    address parentB,
    uint256 tokenIdA,
    uint256 tokenIdB,
    uint256 newTokenId,
    bool found
  );
  event ListedAPlanet(
    address sentFromUser,
    address token,
    uint256 tokenId,
    uint256 price
  );
  event DeListedAPlanet(
    address sentToUser,
    address token,
    uint256 tokenId,
    bool success
  );
  event DeClaimedAPlanet(
    address sentToUser,
    address token,
    uint256 tokenId,
    bool success
  );

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
  mapping(uint256 => address) public conjunctingTokenIdToOwnerAddr;

  // users to planets owed after conjunction
  mapping(address => ClaimablePlanet[]) public claimablePlanets;

  uint256 mktFee;

  mapping(uint256 => address) public tokenIdClaimableToOwnerAddr;

  mapping(uint256 => address) public listedTokenIdToOwnerAddr;

  IERC20 aprsContract; // now unnecessary
  IERC20 animaContract; // now unnecessary

  mapping(uint256 => ClaimablePlanet[]) public orphanClaims;

  IERC721 managerPlanetContract;

  mapping(uint256 => uint256) public tokenIdToPrice;

  uint256 delistedPriceValue = 2 ** 256 - 1;

  // getter functions
  function getClaimablePlanetsFor(
    address userAddr
  ) public view returns (ClaimablePlanet[] memory) {
    return claimablePlanets[userAddr];
  }

  function getPriceFor(uint256 tokenId) public view returns (uint256) {
    return tokenIdToPrice[tokenId];
  }

  // function removeClaimablePlanetByIndex(
  //   address userAddr,
  //   uint256 index
  // ) public onlyOwner {
  //   require(index < claimablePlanets[userAddr].length, "Index out of bounds");

  //   // Move the last element into the place to delete
  //   claimablePlanets[userAddr][index] = claimablePlanets[userAddr][
  //     claimablePlanets[userAddr].length - 1
  //   ];
  //   // Remove the last element
  //   claimablePlanets[userAddr].pop();
  // }

  function getConjunctingTokenIdToOwnerAddr(
    uint256 claimableTokenId
  ) public view returns (address) {
    return conjunctingTokenIdToOwnerAddr[claimableTokenId];
  }

  function getListedTokenIdToOwnerAddr(
    uint256 listedTokenId
  ) public view returns (address) {
    return listedTokenIdToOwnerAddr[listedTokenId];
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

  function approveAllERC721Tokens(
    IERC721 token,
    address operator
  ) public onlyOwner whenNotPaused {
    token.setApprovalForAll(operator, true);
  }

  function approveERC20(IERC20 token, address spender, uint256 amount) public {
    require(token.approve(spender, amount), "ERC20 approve failed");
  }

  /// @notice function should be run after deployment to set up defaults
  function setAllOf(
    address _breederContractAddr,
    uint256 _vrfValue,
    address _nftContractAddr,
    address _aprsContract,
    address _animaContract,
    address _mgrContract
  ) public virtual onlyOwner whenNotPaused {
    vrfValue = _vrfValue;
    breedContract = IBreedContract(_breederContractAddr);
    nftPlanetContract = IERC721(_nftContractAddr);
    aprsContract = IERC20(_aprsContract);
    animaContract = IERC20(_animaContract);
    managerPlanetContract = IERC721(_mgrContract);
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

    listedTokenIdToOwnerAddr[tokenId] = ownerAddress;

    tokenIdToPrice[tokenId] = price;

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
    // send new planet to owner
    bool success = _sendNFT(claimableTokenId, sendToAddr);

    // // mark claim as delivered
    markAsDelivered(claimableTokenId);

    // emit accomplishment
    emit DeClaimedAPlanet(
      sendToAddr,
      address(nftPlanetContract),
      claimableTokenId,
      success
    );
  }

  function claimPlanet(uint256 claimableTokenId) public whenNotPaused {
    address user = msg.sender;
    address userThatCanClaim = tokenIdClaimableToOwnerAddr[claimableTokenId];
    if (userThatCanClaim == address(0)) {
      revert("address has not been set.  Claim nonexistence likely");
    } else if (userThatCanClaim == address(1)) {
      revert("planet has been orphaned.");
    } else if (userThatCanClaim != user) {
      revert("claim must be from claimants address-- disallowed.");
    }
    // user is approved
    bool success = _sendNFT(claimableTokenId, user);
    if (!success) {
      revert("Failed to send NFT. Check Claimant TokenId sent");
    }
    // mark claim as delivered
    markAsDelivered(claimableTokenId);

    // emit accomplishment
    emit DeClaimedAPlanet(
      user,
      address(nftPlanetContract),
      claimableTokenId,
      success
    );
  }

  function markAsDelivered(uint256 claimableTokenId) internal {
    address owner = tokenIdClaimableToOwnerAddr[claimableTokenId];
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
    uint256 newTokenId,
    uint256[2] memory parentTokenIds
  ) internal virtual {
    address parentA = parents[0];
    address parentB = parents[1];
    uint256 tokenIdA = parentTokenIds[0];
    uint256 tokenIdB = parentTokenIds[1];
    bool found = false;

    // Check for parentA
    for (uint i = 0; i < claimablePlanets[parentA].length; i++) {
      if (
        (claimablePlanets[parentA][i].otherParent == parentB &&
          (claimablePlanets[parentA][i].ownerTokenId == tokenIdA &&
            claimablePlanets[parentA][i].otherTokenId == tokenIdB)) ||
        (claimablePlanets[parentA][i].ownerTokenId == tokenIdB &&
          claimablePlanets[parentA][i].otherTokenId == tokenIdA)
      ) {
        claimablePlanets[parentA][i].arrived = true;
        claimablePlanets[parentA][i].claimsTokenId = newTokenId;
        found = true;
        tokenIdClaimableToOwnerAddr[newTokenId] = parentA;

        break;
      }
    }

    // If not found for parentA, check for parentB
    if (!found) {
      for (uint i = 0; i < claimablePlanets[parentB].length; i++) {
        if (
          (claimablePlanets[parentB][i].otherParent == parentA &&
            (claimablePlanets[parentB][i].ownerTokenId == tokenIdB &&
              claimablePlanets[parentB][i].otherTokenId == tokenIdA)) ||
          (claimablePlanets[parentB][i].ownerTokenId == tokenIdA &&
            claimablePlanets[parentB][i].otherTokenId == tokenIdB)
        ) {
          claimablePlanets[parentB][i].arrived = true;
          claimablePlanets[parentB][i].claimsTokenId = newTokenId;
          found = true;
          tokenIdClaimableToOwnerAddr[newTokenId] = parentB;
          break;
        }
      }
    }

    if (!found) {
      // note that which addr is owner and other would both be unknown...
      // this is a bad path!
      emit Orphaning(parentA, parentB, tokenIdA, tokenIdB, newTokenId, found);
    }
  }

  function setArrivedOwner(
    address[2] memory parents,
    uint256 newTokenId,
    uint256[2] memory parentTokenIds
  ) public onlyOwner {
    setArrivedToTrue(parents, newTokenId, parentTokenIds);
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
      operator == address(managerPlanetContract) &&
      msg.sender == address(breedContract)
    ) {
      // minted from breed contract, send to claimable planets, first get parents
      (PlanetData memory newPlanetData, ) = nftPlanetContract.getPlanetData(
        tokenId
      );
      // check who the planet's parents are
      uint256[] memory parentsIDs = newPlanetData.parents;
      // lookup + package addresses from Parent TokenIDs
      address addressParentA = conjunctingTokenIdToOwnerAddr[parentsIDs[0]];
      address addressParentB = conjunctingTokenIdToOwnerAddr[parentsIDs[1]];

      address[2] memory parents = [addressParentA, addressParentB];
      uint256[2] memory parentsIDsSized = [
        newPlanetData.parents[0],
        newPlanetData.parents[1]
      ];

      // Emit an event with details about the NFT received
      emit NftReceived(operator, from, tokenId, data, "new planet");

      // see description, sets arrived to true, user can now have it delivered
      setArrivedToTrue(parents, tokenId, parentsIDsSized);
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
      price: delistedPriceValue,
      ownerAddress: planetToDeList.ownerAddress,
      active: false
    });

    // maximum uin256 value to delist
    tokenIdToPrice[tokenId] = delistedPriceValue;

    // send planet back to owner
    bool success = _sendNFT(tokenId, user);
    if (!success) {
      revert("deListing Failed send NFT process");
    } else {
      // delist on mapping
      // this solution keeps the array cleaner but moves keys around
      userToListedPlanets[msg.sender];
      userToListedPlanets[msg.sender][idIndex] = userToListedPlanets[
        msg.sender
      ][userToListedPlanets[msg.sender].length - 1];
      userToListedPlanets[msg.sender].pop();

      // delist from mapping
      listedTokenIdToOwnerAddr[tokenId] = address(0);
    }

    // emit accomplishment
    emit DeListedAPlanet(
      user,
      address(nftPlanetContract),
      planetToDeList.tokenId,
      success
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
  // @dev: make sure approval for all for (anima + aprs + nfts) before use
  // @param yourPlanet the planet user intends to breed
  // @param withListedPlanet the planet user intends to breed with
  function conjunct(
    uint256 yourPlanet,
    uint256 withListedPlanet
  ) public payable whenNotPaused {
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

    // Check if the user has enough APRS tokens to cover the price and fee
    uint256 total = price + fee;
    require(
      aprsContract.balanceOf(msg.sender) >= total,
      "Insufficient APRS balance to cover price and fee"
    );

    require(
      msg.value >= vrfValue,
      string(
        abi.encodePacked(
          "Insufficient funds to cover VRF cost. Required: ",
          Strings.toString(vrfValue),
          ", Sent: ",
          Strings.toString(msg.value)
        )
      )
    );

    address userAsking = msg.sender;

    // Find the owner of the `withListedPlanet`
    address payable ownerOfListedPlanet;
    uint256 otherTokenId;
    for (uint i = 0; i < planetsListed.length; i++) {
      if (planetsListed[i].tokenId == withListedPlanet) {
        ownerOfListedPlanet = payable(planetsListed[i].ownerAddress);
        otherTokenId = planetsListed[i].tokenId;
        break;
      }
    }

    // Transfer APRS tokens to the owner of the listed planet
    require(
      aprsContract.transferFrom(msg.sender, ownerOfListedPlanet, price),
      "Failed to transfer APRS tokens"
    );

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
    // list claimable planet.
    claimablePlanets[userAsking].push(newClaimable);
    // Once Breed/VRF returns it, arrived will be set to true

    // mark users so they can be looked up via tokenid
    conjunctingTokenIdToOwnerAddr[yourPlanet] = userAsking;
    conjunctingTokenIdToOwnerAddr[otherTokenId] = ownerOfListedPlanet;

    if (msg.value > vrfValue) {
      (bool refunded, ) = msg.sender.call{ value: msg.value - vrfValue }("");
      require(refunded, "Failed to refund excess Ether");
    }

    // emit conjunction
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

  function withdrawAndSplitHalfsies(
    address address1,
    address address2,
    uint withdrawalAmount
  ) public onlyOwner whenNotPaused {
    require(withdrawalAmount <= address(this).balance, "Insufficient balance");
    uint halfAmount = withdrawalAmount / 2;
    // Transfer half the withdrawal amount to each address
    payable(address1).transfer(halfAmount);
    payable(address2).transfer(halfAmount);
  }

  function withdrawAndSplitERC20(
    address tokenAddress,
    address address1,
    address address2,
    uint withdrawalAmount
  ) public onlyOwner whenNotPaused {
    IERC20 token = IERC20(tokenAddress);
    uint balance = token.balanceOf(address(this));
    require(withdrawalAmount <= balance, "Insufficient balance");
    uint halfAmount = withdrawalAmount / 2;
    // Transfer half the withdrawal amount to each address
    require(
      token.transfer(address1, halfAmount),
      "Transfer to address1 failed"
    );
    require(
      token.transfer(address2, halfAmount),
      "Transfer to address2 failed"
    );
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
