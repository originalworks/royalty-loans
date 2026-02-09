// SPDX-License-Identifier: MIT
pragma solidity ^0.8.32;

import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@royalty-loans/contracts-agreements/contracts/interfaces/IAgreement.sol';
import './interfaces/IRoyaltyAdvance.sol';

enum AdvanceState {
  Uninitialized,
  Pending,
  Revoked,
  Active,
  Repaid
}

contract RoyaltyAdvance is
  IRoyaltyAdvance,
  ERC1155Holder,
  Initializable,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  error NoCollateralsProvided();
  error CollateralNotTransferred(uint256 collateralIndex);
  error ZeroCollateralTokenAddress(uint256 collateralIndex);
  error ZeroCollateralAmount(uint256 collateralIndex);
  error ZeroRecipientAddress();
  error ZeroCollateralReceiverAddress();
  error ZeroPaymentTokenAddress();
  error ZeroDuration();
  error ZeroAdvanceAmount();
  error FeePpmTooHigh();
  error AdvanceAlreadyActive();
  error AdvanceOfferExpired();
  error AdvanceOfferRevoked();
  error AdvanceNotActive();
  error NoPaymentTokenToProcess();
  error OnlyRecipientAllowed();

  Collateral[] public collaterals;
  IERC20 public paymentToken;
  address public recipient;
  address public advancer;
  address public collateralReceiver;
  uint256 public feePpm;
  uint256 public advanceAmount;
  uint256 public expirationDate;

  AdvanceState public advanceState;

  uint256 public totalDue;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    Collateral[] calldata _collaterals,
    address _paymentTokenAddress,
    address _recipientAddress,
    address _collateralReceiverAddress,
    uint256 _feePpm,
    uint256 _advanceAmount,
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
    if (_recipientAddress == address(0)) revert ZeroRecipientAddress();
    if (_collateralReceiverAddress == address(0))
      revert ZeroCollateralReceiverAddress();
    if (_advanceAmount == 0) revert ZeroAdvanceAmount();
    if (_feePpm > 1_000_000) revert FeePpmTooHigh();
    if (_paymentTokenAddress == address(0)) revert ZeroPaymentTokenAddress();
    if (_duration == 0) revert ZeroDuration();

    paymentToken = IERC20(_paymentTokenAddress);
    recipient = _recipientAddress;
    collateralReceiver = _collateralReceiverAddress;
    feePpm = _feePpm;
    advanceAmount = _advanceAmount;
    totalDue = advanceAmount + ((advanceAmount * feePpm) / 1_000_000);
    expirationDate = block.timestamp + _duration;
    advanceState = AdvanceState.Pending;
  }

  function provideAdvance() external nonReentrant {
    AdvanceState state = advanceState;

    if (state == AdvanceState.Active) revert AdvanceAlreadyActive();
    if (block.timestamp > expirationDate) revert AdvanceOfferExpired();
    if (state == AdvanceState.Revoked) revert AdvanceOfferRevoked();

    advancer = msg.sender;
    paymentToken.safeTransferFrom(msg.sender, recipient, advanceAmount);

    advanceState = AdvanceState.Active;

    emit AdvanceProvided(advancer);
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
    if (advanceState != AdvanceState.Active) revert AdvanceNotActive();

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
          collateralReceiver,
          collaterals[i].tokenId,
          collaterals[i].tokenAmount,
          ''
        );

        unchecked {
          i++;
        }
      }

      paymentToken.safeTransfer(advancer, totalDue);

      if (currentBalance > totalDue) {
        uint256 excess = currentBalance - totalDue;

        paymentToken.safeTransfer(collateralReceiver, excess);
      }

      emit AdvanceRepaid(totalDue);

      totalDue = 0;
      advanceState = AdvanceState.Repaid;
    } else {
      // Partial repayment
      totalDue = totalDue - currentBalance;

      paymentToken.safeTransfer(advancer, currentBalance);

      emit AdvancePartiallyRepaid(currentBalance);
    }
  }

  function reclaimExcessPaymentToken() external nonReentrant {
    AdvanceState state = advanceState;

    if (state == AdvanceState.Active) revert AdvanceAlreadyActive();

    uint256 currentBalance = paymentToken.balanceOf(address(this));

    if (currentBalance == 0) revert NoPaymentTokenToProcess();

    if (state == AdvanceState.Repaid) {
      paymentToken.safeTransfer(collateralReceiver, currentBalance);
    } else {
      paymentToken.safeTransfer(recipient, currentBalance);
    }
  }

  function revokeAdvance() external nonReentrant {
    AdvanceState state = advanceState;

    if (state == AdvanceState.Active) revert AdvanceAlreadyActive();
    if (state == AdvanceState.Revoked) revert AdvanceOfferRevoked();
    if (msg.sender != recipient) revert OnlyRecipientAllowed();

    uint256 collateralsLength = collaterals.length;

    for (uint i = 0; i < collateralsLength; ) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        address(this),
        recipient,
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
      paymentToken.safeTransfer(recipient, currentBalance);
    }

    advanceState = AdvanceState.Revoked;
    emit AdvanceRevoked();
  }
}
