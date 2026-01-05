// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import './ICollateral.sol';

interface IBeneficiaryRoyaltyLoan is ICollateral {
  event LoanProvided(address lender);
  event LoanPartialyRepaid(uint256 repaymentAmount);
  event LoanRepaid(uint256 repaymentAmount);
  event LoanRevoked();

  function initialize(
    CollateralWithBeneficiaries[] calldata _collaterals,
    address _paymentTokenAddress,
    address _borrowerAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) external;

  function provideLoan() external;

  function processRepayment() external;

  function revokeLoan() external;

  function reclaimExcessPaymentToken() external;
}
