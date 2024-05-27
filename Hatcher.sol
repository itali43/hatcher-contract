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


/// @title HatcherGG
/// @author Elliott Williams
/// @notice This contract allows for escrowed NFT breeding
/// @dev Contract is liable to be updated without warning
/// @custom:security-contact security@earnalliance.com
contract HatcherV1 is
  Initializable,
  PausableUpgradeable,
  ERC1155SupplyUpgradeable,
  UUPSUpgradeable,
  EIP712Upgradeable,
  OwnableUpgradeable
{
  using AddressUpgradeable for address payable;

  /// @notice This event is emitted when a request to middleman is sent
  /// @param reqId requestId of randomness in mint
  /// @param mintedTo the address minted to
  /// @param amt number of minted characters
  /// @param rand random number used for persona
  /// @param tid Token ID minted
  event Minted(
    uint256 indexed reqId,
    address mintedTo,
    uint256 amt,
    uint256 rand,
    uint256 tid
  );

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
  function initialize(
    string memory name,
    string memory version,
  ) public initializer {

    __ERC1155_init("");
    __Ownable_init();
    __Pausable_init();
    // __ERC1155Burnable_init();
    __ERC1155Supply_init();
    __UUPSUpgradeable_init();
    __EIP712_init(name, version);
    s_signer = _signer;
    treasuryAddr = payable(0x459EEAbA1311f54314c8E73E18d6C2616883af8c);
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

  /// @notice called to authorize Upgrades by owner only
  /// @dev used to upgrade
  /// @param newImplementation new implementation
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  /// @notice Allow Owner to withdraw of MATIC from the contract
  /// @dev utility function only, shouldn't need to be used.
  function withdrawFunds() public onlyOwner {
    address payable to = payable(msg.sender);
    to.transfer(address(this).balance);
  }

  receive() external payable {}
}
