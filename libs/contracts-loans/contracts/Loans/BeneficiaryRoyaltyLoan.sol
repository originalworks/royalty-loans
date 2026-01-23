// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './interfaces/IAgreementERC1155.sol';
import './interfaces/IBeneficiaryRoyaltyLoan.sol';

enum LoanState {
  Uninitialized,
  Pending,
  Revoked,
  Active,
  Repaid
}

contract BeneficiaryRoyaltyLoan is
  IBeneficiaryRoyaltyLoan,
  ERC1155Holder,
  Initializable,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  error NoCollateralsProvided();
  error ZeroCollateralTokenAddress(uint256 collateralIndex);
  error ZeroCollateralAmount(uint256 collateralIndex);
  error CollateralNotTransferred(uint256 collateralIndex);
  error ZeroBeneficiaries(uint256 collateralIndex);
  error ZeroBeneficiaryAddress(
    uint256 collateralIndex,
    uint256 beneficiaryIndex
  );
  error ZeroBeneficiaryPpm(uint256 collateralIndex, uint256 beneficiaryIndex);
  error BeneficiariesPpmSumMismatch(uint256 collateralIndex);
  error ZeroPaymentTokenAddress();
  error ZeroDuration();
  error ZeroLoanAmount();
  error FeePpmTooHigh();
  error LoanAlreadyActive();
  error LoanOfferExpired();
  error LoanOfferRevoked();
  error LoanNotActive();
  error NoPaymentTokenToProcess();
  error OnlyBorrowerAllowed();

  uint256 public constant PPM_DENOMINATOR = 1_000_000;

  CollateralWithBeneficiaries[] public collaterals;
  IERC20 public paymentToken;
  address public borrower;
  address public lender;
  uint256 public feePpm;
  uint256 public loanAmount;
  uint256 public expirationDate;

  LoanState public loanState;

  uint256 public totalDue;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    CollateralWithBeneficiaries[] calldata _collaterals,
    address _paymentTokenAddress,
    address _borrowerAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) public initializer {
    uint256 collateralsLength = _collaterals.length;
    if (collateralsLength == 0) revert NoCollateralsProvided();

    for (uint i = 0; i < collateralsLength; ) {
      CollateralWithBeneficiaries calldata collateral = _collaterals[i];
      uint256 beneficiariesLength = collateral.beneficiaries.length;

      if (collateral.tokenAddress == address(0))
        revert ZeroCollateralTokenAddress(i);

      if (collateral.tokenAmount == 0) revert ZeroCollateralAmount(i);

      if (beneficiariesLength == 0) revert ZeroBeneficiaries(i);

      if (
        IERC1155(collateral.tokenAddress).balanceOf(
          address(this),
          collateral.tokenId
        ) != collateral.tokenAmount
      ) revert CollateralNotTransferred(i);

      uint256 totalPpm;

      for (uint256 j = 0; j < beneficiariesLength; ) {
        Beneficiary calldata beneficiary = collateral.beneficiaries[j];

        if (beneficiary.beneficiaryAddress == address(0))
          revert ZeroBeneficiaryAddress(i, j);

        if (beneficiary.ppm == 0) revert ZeroBeneficiaryPpm(i, j);

        totalPpm += beneficiary.ppm;

        unchecked {
          j++;
        }
      }

      if (totalPpm != PPM_DENOMINATOR) revert BeneficiariesPpmSumMismatch(i);

      collaterals.push(collateral);

      unchecked {
        i++;
      }
    }

    if (_loanAmount == 0) revert ZeroLoanAmount();
    if (_feePpm > PPM_DENOMINATOR) revert FeePpmTooHigh();
    if (_paymentTokenAddress == address(0)) revert ZeroPaymentTokenAddress();
    if (_duration == 0) revert ZeroDuration();

    paymentToken = IERC20(_paymentTokenAddress);
    borrower = _borrowerAddress;
    feePpm = _feePpm;
    loanAmount = _loanAmount;
    totalDue = loanAmount + ((loanAmount * feePpm) / PPM_DENOMINATOR);
    expirationDate = block.timestamp + _duration;
    loanState = LoanState.Pending;
  }

  function provideLoan() external nonReentrant {
    if (loanState == LoanState.Active) revert LoanAlreadyActive();
    if (block.timestamp > expirationDate) revert LoanOfferExpired();
    if (loanState == LoanState.Revoked) revert LoanOfferRevoked();

    lender = msg.sender;
    paymentToken.safeTransferFrom(msg.sender, borrower, loanAmount);

    loanState = LoanState.Active;

    emit LoanProvided(lender);
  }

  function _distributePaymentTokenToBeneficiaries(uint256 amount) internal {
    if (amount == 0) revert NoPaymentTokenToProcess();

    uint256 totalCollateralsAmount;
    uint256 collateralsLength = collaterals.length;

    for (uint256 i = 0; i < collateralsLength; ) {
      totalCollateralsAmount += collaterals[i].tokenAmount;
      unchecked {
        i++;
      }
    }

    uint256 remainingAmount = amount;

    for (uint256 i = 0; i < collateralsLength; ) {
      CollateralWithBeneficiaries memory collateral = collaterals[i];

      uint256 collateralShare = (amount * collateral.tokenAmount) /
        totalCollateralsAmount;

      // last collateral gets remainder (dust-free)
      if (i == collateralsLength - 1) {
        collateralShare = remainingAmount;
      } else {
        remainingAmount -= collateralShare;
      }

      if (collateralShare == 0) {
        unchecked {
          i++;
        }
        continue;
      }

      uint256 remainingCollateralShare = collateralShare;
      uint256 beneficiariesLength = collateral.beneficiaries.length;

      for (uint256 j = 0; j < beneficiariesLength; ) {
        Beneficiary memory beneficiary = collateral.beneficiaries[j];

        uint256 beneficiaryShare = (collateralShare * beneficiary.ppm) /
          PPM_DENOMINATOR;

        // last beneficiary gets remainder (dust-free)
        if (j == beneficiariesLength - 1) {
          beneficiaryShare = remainingCollateralShare;
        } else {
          remainingCollateralShare -= beneficiaryShare;
        }

        if (beneficiaryShare > 0) {
          paymentToken.safeTransfer(
            beneficiary.beneficiaryAddress,
            beneficiaryShare
          );
        }

        unchecked {
          j++;
        }
      }

      unchecked {
        i++;
      }
    }
  }

  function claimCollateralBalance(address _collateralTokenAddress) private {
    if (paymentToken.balanceOf(_collateralTokenAddress) > 0) {
      IAgreementERC1155(_collateralTokenAddress).claimHolderFunds(
        address(this),
        address(paymentToken)
      );
    }
  }

  function processRepayment() external nonReentrant {
    if (loanState != LoanState.Active) revert LoanNotActive();

    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      claimCollateralBalance(collaterals[i].tokenAddress);

      unchecked {
        i++;
      }
    }

    uint256 currentBalance = paymentToken.balanceOf(address(this));
    if (currentBalance == 0) revert NoPaymentTokenToProcess();

    if (currentBalance >= totalDue) {
      // Full repayment
      for (uint256 i = 0; i < collateralsLength; ) {
        CollateralWithBeneficiaries memory collateral = collaterals[i];
        uint256 remainingShares = collateral.tokenAmount;
        uint256 beneficiariesLength = collateral.beneficiaries.length;

        for (uint256 j = 0; j < beneficiariesLength; ) {
          Beneficiary memory beneficiary = collateral.beneficiaries[j];

          uint256 beneficiaryShare = (collateral.tokenAmount *
            beneficiary.ppm) / PPM_DENOMINATOR;

          // last beneficiary gets remainder (dust-free)
          if (j == beneficiariesLength - 1) {
            beneficiaryShare = remainingShares;
          } else {
            remainingShares -= beneficiaryShare;
          }

          if (beneficiaryShare > 0) {
            IERC1155(collateral.tokenAddress).safeTransferFrom(
              address(this),
              beneficiary.beneficiaryAddress,
              collateral.tokenId,
              beneficiaryShare,
              ''
            );
          }

          unchecked {
            j++;
          }
        }

        unchecked {
          i++;
        }
      }

      paymentToken.safeTransfer(lender, totalDue);

      if (currentBalance > totalDue) {
        _distributePaymentTokenToBeneficiaries(currentBalance - totalDue);
      }

      emit LoanRepaid(totalDue);

      totalDue = 0;
      loanState = LoanState.Repaid;
    } else {
      // Partial repayment
      totalDue = totalDue - currentBalance;
      paymentToken.safeTransfer(lender, currentBalance);

      emit LoanPartialyRepaid(currentBalance);
    }
  }

  function reclaimExcessPaymentToken() external nonReentrant {
    if (loanState == LoanState.Active) revert LoanAlreadyActive();

    uint256 currentBalance = paymentToken.balanceOf(address(this));

    if (currentBalance == 0) revert NoPaymentTokenToProcess();

    if (loanState == LoanState.Repaid) {
      _distributePaymentTokenToBeneficiaries(currentBalance);
    } else {
      paymentToken.safeTransfer(borrower, currentBalance);
    }
  }

  function revokeLoan() external nonReentrant {
    if (loanState == LoanState.Active) revert LoanAlreadyActive();
    if (loanState == LoanState.Revoked) revert LoanOfferRevoked();
    if (msg.sender != borrower) revert OnlyBorrowerAllowed();

    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        address(this),
        borrower,
        collaterals[i].tokenId,
        collaterals[i].tokenAmount,
        ''
      );

      unchecked {
        i++;
      }
    }

    uint256 currentBalance = paymentToken.balanceOf(address(this));
    if (currentBalance > 0) {
      paymentToken.safeTransfer(borrower, currentBalance);
    }

    loanState = LoanState.Revoked;
    emit LoanRevoked();
  }
}
