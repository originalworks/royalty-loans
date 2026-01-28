// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165Checker.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@royalty-loans/contracts-agreements/contracts/interfaces/IAgreementFactory.sol';
import './interfaces/IRoyaltyLoan.sol';

contract RoyaltyLoanFactory is
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable
{
  using ERC165Checker for address;

  error ZeroTemplateAddress();
  error ZeroDuration();
  error ZeroPaymentTokenAddress();
  error ZeroMaxCollateralsPerLoan();
  error NotAgreementFactory();
  error ZeroCollateralTokenAddress();
  error TooManyCollaterals();
  error CollateralNotERC1155(address collateralAddress);
  error CollateralNotRegistered(address collateralAddress);

  event TemplateChanged(address previousAddress, address newAddress);

  event OfferDurationChanged(
    uint256 previousOfferDuration,
    uint256 newOfferDuration
  );

  event PaymentTokenChanged(
    address previousPaymentToken,
    address newPaymentToken
  );

  event AgreementFactoryChanged(
    address previousAgreementFactory,
    address newAgreementFactory
  );

  event MaxCollateralsPerLoanChanged(
    uint256 previousMaxCollateralsPerLoan,
    uint256 newMaxCollateralsPerLoan
  );

  event LoanContractCreated(
    address loanContract,
    address borrower,
    address receiver,
    ICollateral.Collateral[] collaterals,
    uint256 loanAmount,
    uint256 feePpm,
    uint256 offerDuration,
    address paymentTokenAddress,
    address templateAddress
  );

  address public paymentTokenAddress;
  address public agreementFactoryAddress;
  uint256 public offerDuration;
  address public templateAddress;
  uint256 public maxCollateralsPerLoan;

  uint256[50] __gap;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _templateAddress,
    address _paymentTokenAddress,
    address _agreementFactoryAddress,
    uint256 _offerDuration,
    uint256 _maxCollateralsPerLoan
  ) public initializer {
    _setTemplateAddress(_templateAddress);
    _setOfferDuration(_offerDuration);
    _setPaymentTokenAddress(_paymentTokenAddress);
    _setAgreementFactoryAddress(_agreementFactoryAddress);
    _setMaxCollateralsPerLoan(_maxCollateralsPerLoan);
    __ReentrancyGuard_init();
    __Ownable_init(msg.sender);
  }

  function _setTemplateAddress(address _templateAddress) private {
    if (_templateAddress == address(0)) {
      revert ZeroTemplateAddress();
    }
    address previousAddress = templateAddress;
    templateAddress = _templateAddress;
    emit TemplateChanged(previousAddress, _templateAddress);
  }

  function setTemplateAddress(address _templateAddress) external onlyOwner {
    _setTemplateAddress(_templateAddress);
  }

  function _setOfferDuration(uint256 _duration) private {
    if (_duration == 0) {
      revert ZeroDuration();
    }
    uint256 previousDuration = offerDuration;
    offerDuration = _duration;
    emit OfferDurationChanged(previousDuration, _duration);
  }

  function setOfferDuration(uint256 _duration) external onlyOwner {
    _setOfferDuration(_duration);
  }

  function _setPaymentTokenAddress(address _paymentTokenAddress) private {
    if (_paymentTokenAddress == address(0)) {
      revert ZeroPaymentTokenAddress();
    }
    address previousPaymentTokenAddress = paymentTokenAddress;
    paymentTokenAddress = _paymentTokenAddress;

    emit PaymentTokenChanged(previousPaymentTokenAddress, _paymentTokenAddress);
  }

  function setPaymentTokenAddress(
    address _paymentTokenAddress
  ) external onlyOwner {
    _setPaymentTokenAddress(_paymentTokenAddress);
  }

  function _setAgreementFactoryAddress(
    address _agreementFactoryAddress
  ) private {
    if (
      _agreementFactoryAddress.supportsInterface(
        type(IAgreementFactory).interfaceId
      ) == false
    ) {
      revert NotAgreementFactory();
    }

    address previousAgreementFactoryAddress = agreementFactoryAddress;
    agreementFactoryAddress = _agreementFactoryAddress;

    emit AgreementFactoryChanged(
      previousAgreementFactoryAddress,
      _agreementFactoryAddress
    );
  }

  function setAgreementFactoryAddress(
    address _agreementFactoryAddress
  ) external onlyOwner {
    _setAgreementFactoryAddress(_agreementFactoryAddress);
  }

  function _setMaxCollateralsPerLoan(uint256 _maxCollateralsPerLoan) private {
    if (_maxCollateralsPerLoan == 0) {
      revert ZeroMaxCollateralsPerLoan();
    }
    uint256 previousMaxCollateralsPerLoan = maxCollateralsPerLoan;

    maxCollateralsPerLoan = _maxCollateralsPerLoan;

    emit MaxCollateralsPerLoanChanged(
      previousMaxCollateralsPerLoan,
      maxCollateralsPerLoan
    );
  }

  function setMaxCollateralsPerLoan(
    uint256 _maxCollateralsPerLoan
  ) external onlyOwner {
    _setMaxCollateralsPerLoan(_maxCollateralsPerLoan);
  }

  function _validateCollateral(address collateralAddress) private view {
    if (collateralAddress == address(0)) {
      revert ZeroCollateralTokenAddress();
    }

    if (!collateralAddress.supportsInterface(type(IERC1155).interfaceId)) {
      revert CollateralNotERC1155(collateralAddress);
    }

    if (
      !IAgreementFactory(agreementFactoryAddress).createdAgreements(
        collateralAddress
      )
    ) {
      revert CollateralNotRegistered(collateralAddress);
    }
  }

  function createLoanContract(
    ICollateral.Collateral[] calldata collaterals,
    address receiver,
    uint256 loanAmount,
    uint256 feePpm
  ) external nonReentrant returns (address) {
    uint256 collateralsLength = collaterals.length;

    if (collateralsLength > maxCollateralsPerLoan) {
      revert TooManyCollaterals();
    }

    for (uint i = 0; i < collateralsLength; ) {
      _validateCollateral(collaterals[i].tokenAddress);

      unchecked {
        i++;
      }
    }

    address clone = Clones.clone(templateAddress);

    for (uint i = 0; i < collateralsLength; ) {
      ICollateral.Collateral calldata collateral = collaterals[i];

      IERC1155(collateral.tokenAddress).safeTransferFrom(
        msg.sender,
        clone,
        collateral.tokenId,
        collateral.tokenAmount,
        ''
      );

      unchecked {
        i++;
      }
    }

    IRoyaltyLoan(clone).initialize(
      collaterals,
      paymentTokenAddress,
      msg.sender,
      receiver,
      feePpm,
      loanAmount,
      offerDuration
    );

    emit LoanContractCreated(
      clone,
      msg.sender,
      receiver,
      collaterals,
      loanAmount,
      feePpm,
      offerDuration,
      paymentTokenAddress,
      templateAddress
    );

    return clone;
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}
}
