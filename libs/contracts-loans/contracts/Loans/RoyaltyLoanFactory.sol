// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165Checker.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@royalty-loans/contracts-agreements/contracts/interfaces/IAgreementFactory.sol';
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
  using ERC165Checker for address;

  error ZeroTemplateAddress();
  error ZeroDuration();
  error ZeroPaymentTokenAddress();
  error NotAgreementFactory();
  error CollateralNotAgreementERC1155(address collateralAddress);

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

  event AgreementFactoryChanged(
    address previousAgreementFactory,
    address newAgreementFactory
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
  address public agreementFactoryAddress;
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
    address _agreementFactoryAddress,
    uint256 _offerDuration
  ) public initializer {
    _setTemplateAddress(LoanType.Standard, _standardTemplateAddress);
    _setTemplateAddress(LoanType.Beneficiary, _beneficiaryTemplateAddress);
    _setOfferDuration(_offerDuration);
    _setPaymentTokenAddress(_paymentTokenAddress);
    _setAgreementFactoryAddress(_agreementFactoryAddress);
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

  function _validateCollateral(address collateralAddress) private view {
    bool isERC1155Receiver = collateralAddress.supportsInterface(
      type(IERC1155Receiver).interfaceId
    );
    bool isRegisteredAgreement = IAgreementFactory(agreementFactoryAddress)
      .createdAgreements(collateralAddress);

    if (!isERC1155Receiver || !isRegisteredAgreement) {
      revert CollateralNotAgreementERC1155(collateralAddress);
    }
  }

  function createLoanContract(
    ICollateral.Collateral[] calldata collaterals,
    uint256 loanAmount,
    uint256 feePpm
  ) external nonReentrant returns (address) {
    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      _validateCollateral(collaterals[i].tokenAddress);

      unchecked {
        i++;
      }
    }

    address template = templates[LoanType.Standard];
    address clone = Clones.clone(template);

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
      template
    );

    return clone;
  }

  function createBeneficiaryLoanContract(
    ICollateral.CollateralWithBeneficiaries[] calldata collaterals,
    uint256 loanAmount,
    uint256 feePpm
  ) external nonReentrant returns (address) {
    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      _validateCollateral(collaterals[i].tokenAddress);

      unchecked {
        i++;
      }
    }

    address template = templates[LoanType.Beneficiary];
    address clone = Clones.clone(template);

    for (uint i = 0; i < collateralsLength; ) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        msg.sender,
        clone,
        collaterals[i].tokenId,
        collaterals[i].tokenAmount,
        ''
      );

      unchecked {
        i++;
      }
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
      template
    );

    return clone;
  }

  function _authorizeUpgrade(address) internal override onlyOwner {}
}
