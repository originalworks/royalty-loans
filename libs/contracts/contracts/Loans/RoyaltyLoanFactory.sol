// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '../Whitelist/WhitelistConsumer.sol';
import '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';

import '../interfaces/IRoyaltyLoan.sol';

contract RoyaltyLoanFactory is
  WhitelistConsumer,
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable
{
  event TemplateChanged(address _previousAddress, address _newAddress);

  bytes1 public constant OPERATIONAL_WHITELIST = 0x01;
  address public immutable usdc;

  uint256 public fee;
  uint256 public offerDuration;
  address public templateAddress;

  event LoanContractCreated(
    address indexed loanContract,
    address indexed borrower,
    address collateralToken,
    uint256 loanAmount
  );

  constructor(address _usdc) {
    _disableInitializers();
    require(_usdc != address(0), 'Invalid USDC address');
    usdc = _usdc;
  }

  function initialize(
    address _templateAddress,
    address _owner,
    address _operationalWhitelistAddress,
    uint256 _fee,
    uint256 _offerDuration
  ) public initializer {
    __Ownable_init();
    __ReentrancyGuard_init();
    _transferOwnership(_owner);

    _setTemplateAddress(_templateAddress);
    _setWhitelistAddress(_operationalWhitelistAddress, OPERATIONAL_WHITELIST);

    _setFee(_fee);
    _setOfferDuration(_offerDuration);
  }

  function _setOfferDuration(uint256 _duration) private {
    require(_duration > 0, 'Duration must be greater than 0');
    offerDuration = _duration;
  }

  function _setFee(uint256 _fee) private {
    require(_fee > 0, 'Fee must be greater than 0');
    fee = _fee;
  }

  function _setTemplateAddress(address _templateAddress) private {
    require(
      _templateAddress != address(0),
      'RoyaltyLoanFactory: _templateAddress is the zero address'
    );
    address previousAddress = templateAddress;
    templateAddress = _templateAddress;
    emit TemplateChanged(previousAddress, _templateAddress);
  }

  function setWhitelistAddress(address _whitelistAddress) external onlyOwner {
    _setWhitelistAddress(_whitelistAddress, OPERATIONAL_WHITELIST);
  }

  function setTemplateAddress(address _templateAddress) external onlyOwner {
    _setTemplateAddress(_templateAddress);
  }

  function setFee(
    uint256 _fee
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    _setFee(_fee);
  }

  function setOfferDuration(
    uint256 _duration
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    _setOfferDuration(_duration);
  }

  function createLoanContract(
    address collateralToken,
    uint256 collateralTokenId,
    uint256 collateralAmount,
    uint256 loanAmount
  ) external nonReentrant returns (address) {
    require(collateralToken != address(0), 'Invalid collateral token address');
    require(collateralAmount > 0, 'Collateral amount must be greater than 0');
    require(loanAmount > 0, 'Loan amount must be greater than 0');

    // Create clone
    address clone = Clones.clone(templateAddress);

    // Initialize loan contract
    IRoyaltyLoan(clone).initialize(
      usdc,
      collateralToken,
      msg.sender,
      fee,
      collateralTokenId,
      collateralAmount,
      loanAmount,
      offerDuration
    );

    // Transfer collateral tokens to loan contract
    IERC1155(collateralToken).safeTransferFrom(
      msg.sender,
      clone,
      collateralTokenId,
      collateralAmount,
      ''
    );

    emit LoanContractCreated(clone, msg.sender, collateralToken, loanAmount);

    return clone;
  }
}
