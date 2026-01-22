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
    require(
      collateralsLength > 0,
      'BeneficiaryRoyaltyLoan: At least 1 collateral must be provided'
    );

    for (uint i = 0; i < collateralsLength; ) {
      CollateralWithBeneficiaries calldata collateral = _collaterals[i];
      uint256 beneficiariesLength = collateral.beneficiaries.length;

      require(
        collateral.tokenAddress != address(0),
        'BeneficiaryRoyaltyLoan: Invalid collateral token address'
      );

      require(
        collateral.tokenAmount > 0,
        'BeneficiaryRoyaltyLoan: Collateral amount must be greater than 0'
      );

      require(
        beneficiariesLength > 0,
        'BeneficiaryRoyaltyLoan: At least 1 beneficiary must be provided'
      );

      require(
        IERC1155(collateral.tokenAddress).balanceOf(
          address(this),
          collateral.tokenId
        ) == collateral.tokenAmount,
        'BeneficiaryRoyaltyLoan: Collateral was not transferred in the required amount'
      );

      uint256 totalPpm;

      for (uint256 j = 0; j < beneficiariesLength; ) {
        Beneficiary calldata beneficiary = collateral.beneficiaries[j];

        require(
          beneficiary.beneficiaryAddress != address(0),
          'BeneficiaryRoyaltyLoan: Invalid beneficiary address'
        );
        require(
          beneficiary.ppm > 0,
          'BeneficiaryRoyaltyLoan: Beneficiary ppm must be greater than 0'
        );
        totalPpm += beneficiary.ppm;

        unchecked {
          j++;
        }
      }

      require(
        totalPpm == PPM_DENOMINATOR,
        'BeneficiaryRoyaltyLoan: Beneficiaries ppm must sum to 1000000'
      );

      collaterals.push(collateral);

      unchecked {
        i++;
      }
    }

    require(
      _loanAmount > 0,
      'BeneficiaryRoyaltyLoan: Loan amount must be greater than 0'
    );
    require(
      _feePpm <= PPM_DENOMINATOR,
      'BeneficiaryRoyaltyLoan: FeePpm exceeds 100%'
    );
    require(
      _paymentTokenAddress != address(0),
      'BeneficiaryRoyaltyLoan: Invalid payment token address'
    );
    require(
      _duration > 0,
      'BeneficiaryRoyaltyLoan: Duration must be greater than 0'
    );

    paymentToken = IERC20(_paymentTokenAddress);
    borrower = _borrowerAddress;
    feePpm = _feePpm;
    loanAmount = _loanAmount;
    totalDue = loanAmount + ((loanAmount * feePpm) / PPM_DENOMINATOR);
    expirationDate = block.timestamp + _duration;
    loanState = LoanState.Pending;
  }

  function provideLoan() external nonReentrant {
    require(
      loanState != LoanState.Active,
      'BeneficiaryRoyaltyLoan: Loan is already active'
    );
    require(
      block.timestamp <= expirationDate,
      'BeneficiaryRoyaltyLoan: Loan offer expired'
    );
    require(
      loanState != LoanState.Revoked,
      'BeneficiaryRoyaltyLoan: Loan offer is revoked'
    );

    lender = msg.sender;
    paymentToken.safeTransferFrom(msg.sender, borrower, loanAmount);

    loanState = LoanState.Active;

    emit LoanProvided(lender);
  }

  function _distributePaymentTokenToBeneficiaries(uint256 amount) internal {
    require(amount > 0, 'BeneficiaryRoyaltyLoan: No payment token to process');

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
    require(
      loanState == LoanState.Active,
      'BeneficiaryRoyaltyLoan: Loan is inactive'
    );

    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      claimCollateralBalance(collaterals[i].tokenAddress);

      unchecked {
        i++;
      }
    }

    uint256 currentBalance = paymentToken.balanceOf(address(this));
    require(
      currentBalance > 0,
      'BeneficiaryRoyaltyLoan: No payment token to process'
    );

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
    require(
      loanState != LoanState.Active,
      'BeneficiaryRoyaltyLoan: Loan is active'
    );

    uint256 currentBalance = paymentToken.balanceOf(address(this));

    require(
      currentBalance > 0,
      'BeneficiaryRoyaltyLoan: No payment token to process'
    );

    if (loanState == LoanState.Repaid) {
      _distributePaymentTokenToBeneficiaries(currentBalance);
    } else {
      paymentToken.safeTransfer(borrower, currentBalance);
    }
  }

  function revokeLoan() external nonReentrant {
    require(
      loanState != LoanState.Active,
      'BeneficiaryRoyaltyLoan: Loan is already active'
    );
    require(
      loanState != LoanState.Revoked,
      'BeneficiaryRoyaltyLoan: Loan offer is revoked'
    );
    require(
      msg.sender == borrower,
      'BeneficiaryRoyaltyLoan: Only borrower can revoke the loan'
    );

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
