// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IRoyaltyLoan {
  event LoanProvided(address lender);
  event LoanPartialyRepaid(uint256 repaymentAmount);
  event LoanRepaid(uint256 repaymentAmount);
  event LoanRevoked();

  function initialize(
    address _collateralTokenAddress,
    uint256 _collateralTokenId,
    uint256 _collateralAmount,
    address _paymentTokenAddress,
    address _borrowerAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) external;

  function provideLoan() external;

  function processRepayment() external;

  function revokeLoan() external;

  function getRemainingTotalDue() external view returns (uint256);

  function reclaimExcessPaymentToken() external;
}
