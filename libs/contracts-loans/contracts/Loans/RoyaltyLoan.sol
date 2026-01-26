// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@royalty-loans/contracts-agreements/contracts/interfaces/IAgreement.sol';
import './interfaces/IRoyaltyLoan.sol';

enum LoanState {
  Uninitialized,
  Pending,
  Revoked,
  Active,
  Repaid
}

contract RoyaltyLoan is
  IRoyaltyLoan,
  ERC1155Holder,
  Initializable,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  // TODO: After renaming create common interface with shared errors!!
  error NoCollateralsProvided();
  error CollateralNotTransferred(uint256 collateralIndex);
  error ZeroCollateralTokenAddress(uint256 collateralIndex);
  error ZeroCollateralAmount(uint256 collateralIndex);
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

  Collateral[] public collaterals;
  IERC1155[] public collateralTokens;
  uint256[] public collateralTokenIds;
  uint256[] public collateralAmounts;
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
    Collateral[] calldata _collaterals,
    address _paymentTokenAddress,
    address _borrowerAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) public initializer {
    uint256 collateralsLength = _collaterals.length;

    if (collateralsLength == 0) revert NoCollateralsProvided();

    for (uint i = 0; i < collateralsLength; ) {
      Collateral calldata collateral = _collaterals[i];

      if (collateral.tokenAddress == address(0))
        revert ZeroCollateralTokenAddress(i);
      if (collateral.tokenAmount == 0) revert ZeroCollateralAmount(i);

      if (
        IERC1155(collateral.tokenAddress).balanceOf(
          address(this),
          collateral.tokenId
        ) != collateral.tokenAmount
      ) {
        revert CollateralNotTransferred(i);
      }

      collaterals.push(collateral);

      unchecked {
        i++;
      }
    }

    if (_loanAmount == 0) revert ZeroLoanAmount();
    if (_feePpm > 1_000_000) revert FeePpmTooHigh();
    if (_paymentTokenAddress == address(0)) revert ZeroPaymentTokenAddress();
    if (_duration == 0) revert ZeroDuration();

    paymentToken = IERC20(_paymentTokenAddress);
    borrower = _borrowerAddress;
    feePpm = _feePpm;
    loanAmount = _loanAmount;
    totalDue = loanAmount + ((loanAmount * feePpm) / 1_000_000);
    expirationDate = block.timestamp + _duration;
    loanState = LoanState.Pending;
  }

  function provideLoan() external nonReentrant {
    LoanState state = loanState;

    if (state == LoanState.Active) revert LoanAlreadyActive();
    if (block.timestamp > expirationDate) revert LoanOfferExpired();
    if (state == LoanState.Revoked) revert LoanOfferRevoked();

    lender = msg.sender;
    paymentToken.safeTransferFrom(msg.sender, borrower, loanAmount);

    loanState = LoanState.Active;

    emit LoanProvided(lender);
  }

  function claimCollateralBalance(address _collateralTokenAddress) private {
    if (paymentToken.balanceOf(_collateralTokenAddress) > 0) {
      IAgreement(_collateralTokenAddress).claimHolderFunds(
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

      paymentToken.safeTransfer(lender, totalDue);

      if (currentBalance > totalDue) {
        uint256 excess = currentBalance - totalDue;

        paymentToken.safeTransfer(borrower, excess);
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

    paymentToken.safeTransfer(borrower, currentBalance);
  }

  function revokeLoan() external nonReentrant {
    LoanState state = loanState;

    if (state == LoanState.Active) revert LoanAlreadyActive();
    if (state == LoanState.Revoked) revert LoanOfferRevoked();
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
