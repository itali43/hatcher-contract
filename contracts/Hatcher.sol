// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

interface IERC721 {
  function transferFrom(address from, address to, uint256 tokenId) external;
  function getPlanetData(
    uint256 tokenId
  ) public view returns (PlanetData memory, bool);
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
    bytes data
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

  address s_signer;

  IERC721 nftPlanetContract;

  uint256 vrfValue;

  mapping(address => ListedPlanet[]) private userToListedPlanets;

  ListedPlanet[] planetsListed;

  /// @notice error given if user other than minter tries to use forbidden funcs
  error Unauthorized();

  /// @notice set URI.  Where metadata and images will come from per tokenId
  /// @param newTAdd the address that the owner would like the new URI to be
  function setTAdd(address payable newTAdd) public onlyOwner {
    treasuryAddr = newTAdd;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initialization of contract, called upon deployment
  /// @dev implements EIP712, is upgradeable, pausable, burn function is custom to save space
  /// @param name name of the contract (EIP712 required)
  /// @param version version of the contract (EIP712 required)
  /// @param _signer this address will be used to sign all mints
  function initialize(
    string memory name,
    string memory version,
    address _breedContractAddr,
    uint256 _vrfValue,
    address _nftContractAddr,
    // address[] memory _payees,
    // uint256[] memory _shares,

    address _signer
  ) public initializer {
    __Ownable_init();
    __Pausable_init();
    // __ERC1155Burnable_init();
    __UUPSUpgradeable_init();
    __EIP712_init(name, version);
    s_signer = _signer;
    vrfValue = _vrfValue;
    treasuryAddr = payable(0x459EEAbA1311f54314c8E73E18d6C2616883af8c);
    breedContract = IBreedContract(_breedContractAddr);
    nftPlanetContract = IERC721(_nftContractAddr);
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

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes memory data
  ) public override returns (bytes4) {
    // Emit an event with details about the NFT received
    emit NftReceived(operator, from, tokenId, data);

    // if new planet arrives
    if (msg.sender == address(0x0000000000000000000000000000000000000000)) {
      // get parents
      (PlanetData memory newPlanetData, bool alive) = nftPlanetContract
        .getPlanetData(tokenId);

      // check who the planet's parents are
      uint256[] parents = newPlanetData.parents;

      // send to parent, should be A or B..
    }

    if (data.length > 0) {
      uint256 priceData = abi.decode(data, (uint256));
      list(tokenId, priceData, from);
      // Perform operations based on the decoded data
    }

    return this.onERC721Received.selector;
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

  // @notice: Conjunction functions takes a listed planet and a initiating user's planet and makes a breed request
  // @dev: must send 0.2 RON along with, such that VRF can operate
  // @param yourPlanet the planet user intends to breed
  // @param withListedPlanet the planet user intends to breed with
  function conjunct(
    uint256 yourPlanet,
    uint256 withListedPlanet
  ) public payable {
    // make sure approval for all for (anima + aprs + nfts) before use
    uint256 listedPlanet = withListedPlanet;
    address userAsking = address(0);

    address joiningUser = address(0);
    uint256 price = 1;

    // can have this fail at breeder contract level or hatcher level.  commented out = breeder level
    // if (msg.value < vrfValue) {
    //       revert();
    // }

    // check if covers vrf value
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
    (bool sent, bytes memory dataFromCall) = ownerOfListedPlanet.call{
      value: amountToSend
    }("");
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
