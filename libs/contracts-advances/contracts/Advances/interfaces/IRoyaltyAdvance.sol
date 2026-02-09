// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.32;

import './ICollateral.sol';

interface IRoyaltyAdvance is ICollateral {
  event AdvanceProvided(address advancer);
  event AdvancePartiallyRepaid(uint256 repaymentAmount);
  event AdvanceRepaid(uint256 repaymentAmount);
  event AdvanceRevoked();

  function initialize(
    Collateral[] calldata _collaterals,
    address _paymentTokenAddress,
    address _recipientAddress,
    address _collateralReceiverAddress,
    uint256 _feePpm,
    uint256 _advanceAmount,
    uint256 _duration
  ) external;

  function provideAdvance() external;

  function processRepayment() external;

  function revokeAdvance() external;

  function reclaimExcessPaymentToken() external;
}
