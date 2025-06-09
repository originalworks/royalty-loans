// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IRoyaltyLoan {
    event LoanProvided(address lender, uint256 loanAmount);
    event CollateralReturned(address collateralTokenAddress, uint256 collateralAmount);
    event LoanPartialyRepaid(uint256 repaymentAmount);
    event LoanRepaid(uint256 repaymentAmount);
    event LoanRevoked();

    function initialize (
        address _usdc,
        address _collateralToken,
        address _borrower,
        uint256 _fee,
        uint256 _collateralTokenId,
        uint256 _collateralAmount,
        uint256 _loanAmount,
        uint256 _duration
    ) external;

    function provideLoan() external;

    function processRepayment() external;
}