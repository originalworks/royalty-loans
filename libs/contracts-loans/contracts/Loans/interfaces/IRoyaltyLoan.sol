// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.32;

import './ICollateral.sol';

interface IRoyaltyLoan is ICollateral {
  event LoanProvided(address lender);
  event LoanPartiallyRepaid(uint256 repaymentAmount);
  event LoanRepaid(uint256 repaymentAmount);
  event LoanRevoked();

  function initialize(
    Collateral[] calldata _collaterals,
    address _paymentTokenAddress,
    address _borrowerAddress,
    address _receiverAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) external;

  function provideLoan() external;

  function processRepayment() external;

  function revokeLoan() external;

  function reclaimExcessPaymentToken() external;
}
