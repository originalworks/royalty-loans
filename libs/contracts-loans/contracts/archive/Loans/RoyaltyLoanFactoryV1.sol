// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import '../../Loans/interfaces/IRoyaltyLoan.sol';
import '../../shared/Whitelist/WhitelistConsumer.sol';

contract RoyaltyLoanFactoryV1 is
  WhitelistConsumer,
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable
{
  event TemplateChanged(address previousAddress, address newAddress);

  event LoanContractCreated(
    address loanContract,
    address borrower,
    ICollateral.Collateral[] collaterals,
    uint256 loanAmount,
    uint256 feePpm
  );

  bytes1 public constant OPERATIONAL_WHITELIST = 0x01;

  address public paymentTokenAddress;
  uint256 public offerDuration;
  address public templateAddress;

  uint256[50] __gap;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _templateAddress,
    address _operationalWhitelistAddress,
    address _paymentTokenAddress,
    uint256 _offerDuration
  ) public initializer {
    _setTemplateAddress(_templateAddress);
    _setWhitelistAddress(_operationalWhitelistAddress, OPERATIONAL_WHITELIST);
    _setOfferDuration(_offerDuration);
    _setPaymentTokenAddress(_paymentTokenAddress);
    __Ownable_init(msg.sender);
  }

  function setWhitelistAddress(
    address _whitelistAddress
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    require(
      _whitelistAddress != address(0),
      'RoyaltyLoanFactory: _whitelistAddress address is the zero address'
    );
    _setWhitelistAddress(_whitelistAddress, OPERATIONAL_WHITELIST);
  }

  function _setWhitelistAddress(
    address _whitelistAddress,
    bytes1 _whitelistId
  ) internal override {
    require(
      _whitelistAddress != address(0),
      'RoyaltyLoanFactory: _whitelistAddress address is the zero address'
    );
    super._setWhitelistAddress(_whitelistAddress, _whitelistId);
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

  function setTemplateAddress(
    address _templateAddress
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    _setTemplateAddress(_templateAddress);
  }

  function _setOfferDuration(uint256 _duration) private {
    require(
      _duration > 0,
      'RoyaltyLoanFactory: _duration must be greater than 0'
    );
    offerDuration = _duration;
  }

  function setOfferDuration(
    uint256 _duration
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    _setOfferDuration(_duration);
  }

  function _setPaymentTokenAddress(address _paymentTokenAddress) private {
    require(
      _paymentTokenAddress != address(0),
      'RoyaltyLoanFactory: _paymentTokenAddress is the zero address'
    );
    paymentTokenAddress = _paymentTokenAddress;
  }

  function setPaymentTokenAddress(
    address _paymentTokenAddress
  ) external isWhitelistedOn(OPERATIONAL_WHITELIST) {
    _setPaymentTokenAddress(_paymentTokenAddress);
  }

  function createLoanContract(
    ICollateral.Collateral[] calldata collaterals,
    uint256 loanAmount,
    uint256 feePpm
  ) external returns (address) {
    address clone = Clones.clone(templateAddress);

    for (uint i = 0; i < collaterals.length; i++) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        msg.sender,
        clone,
        collaterals[i].tokenId,
        collaterals[i].tokenAmount,
        ''
      );
    }

    IRoyaltyLoan(clone).initialize(
      collaterals,
      paymentTokenAddress,
      msg.sender,
      feePpm,
      loanAmount,
      offerDuration
    );

    emit LoanContractCreated(
      clone,
      msg.sender,
      collaterals,
      loanAmount,
      feePpm
    );

    return clone;
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}
}
