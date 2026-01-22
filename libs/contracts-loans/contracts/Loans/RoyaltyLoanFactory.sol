// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import './interfaces/IRoyaltyLoan.sol';
import './interfaces/IBeneficiaryRoyaltyLoan.sol';

enum LoanType {
  Standard,
  Beneficiary
}

contract RoyaltyLoanFactory is
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable
{
  error ZeroTemplateAddress();
  error InvalidOfferDuration();
  error ZeroPaymentTokenAddress();

  event TemplateChanged(
    LoanType loanType,
    address previousAddress,
    address newAddress
  );

  event OfferDurationChanged(
    uint256 previousOfferDuration,
    uint256 newOfferDuration
  );

  event PaymentTokenChanged(
    address previousPaymentToken,
    address newPaymentToken
  );

  event LoanContractCreated(
    address loanContract,
    address borrower,
    ICollateral.Collateral[] collaterals,
    uint256 loanAmount,
    uint256 feePpm,
    uint256 offerDuration,
    address paymentTokenAddress,
    address templateAddress
  );

  event BeneficiaryLoanContractCreated(
    address loanContract,
    address borrower,
    ICollateral.CollateralWithBeneficiaries[] collaterals,
    uint256 loanAmount,
    uint256 feePpm,
    uint256 offerDuration,
    address paymentTokenAddress,
    address templateAddress
  );

  address public paymentTokenAddress;
  uint256 public offerDuration;

  mapping(LoanType => address) public templates;

  uint256[50] __gap;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _standardTemplateAddress,
    address _beneficiaryTemplateAddress,
    address _paymentTokenAddress,
    uint256 _offerDuration
  ) public initializer {
    _setTemplateAddress(LoanType.Standard, _standardTemplateAddress);
    _setTemplateAddress(LoanType.Beneficiary, _beneficiaryTemplateAddress);
    _setOfferDuration(_offerDuration);
    _setPaymentTokenAddress(_paymentTokenAddress);
    __ReentrancyGuard_init();
    __Ownable_init(msg.sender);
  }

  function _setTemplateAddress(
    LoanType _loanType,
    address _templateAddress
  ) private {
    if (_templateAddress == address(0)) {
      revert ZeroTemplateAddress();
    }
    address previousAddress = templates[_loanType];
    templates[_loanType] = _templateAddress;
    emit TemplateChanged(_loanType, previousAddress, _templateAddress);
  }

  function setTemplateAddress(
    LoanType _loanType,
    address _templateAddress
  ) external onlyOwner {
    _setTemplateAddress(_loanType, _templateAddress);
  }

  function _setOfferDuration(uint256 _duration) private {
    if (_duration == 0) {
      revert InvalidOfferDuration();
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

  function createLoanContract(
    ICollateral.Collateral[] calldata collaterals,
    uint256 loanAmount,
    uint256 feePpm
  ) external nonReentrant returns (address) {
    address clone = Clones.clone(templates[LoanType.Standard]);

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
      feePpm,
      offerDuration,
      paymentTokenAddress,
      templates[LoanType.Standard]
    );

    return clone;
  }

  function createBeneficiaryLoanContract(
    ICollateral.CollateralWithBeneficiaries[] calldata collaterals,
    uint256 loanAmount,
    uint256 feePpm
  ) external nonReentrant returns (address) {
    address clone = Clones.clone(templates[LoanType.Beneficiary]);

    for (uint i = 0; i < collaterals.length; i++) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        msg.sender,
        clone,
        collaterals[i].tokenId,
        collaterals[i].tokenAmount,
        ''
      );
    }

    IBeneficiaryRoyaltyLoan(clone).initialize(
      collaterals,
      paymentTokenAddress,
      msg.sender,
      feePpm,
      loanAmount,
      offerDuration
    );

    emit BeneficiaryLoanContractCreated(
      clone,
      msg.sender,
      collaterals,
      loanAmount,
      feePpm,
      offerDuration,
      paymentTokenAddress,
      templates[LoanType.Beneficiary]
    );

    return clone;
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}
}
