// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './interfaces/IRoyaltyLoan.sol';
import './interfaces/IAgreementERC1155.sol';

contract RoyaltyLoan is IRoyaltyLoan, ERC1155Holder, Initializable {
  using SafeERC20 for IERC20;
  using Strings for uint256;

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
  bool public loanActive = false;
  bool public loanOfferActive = false;

  uint256 private _totalDue;

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
    require(
      _collaterals.length > 0,
      'RoyaltyLoan: At least 1 collateral must be provided'
    );

    for (uint i = 0; i < _collaterals.length; i++) {
      Collateral calldata collateral = _collaterals[i];

      require(
        collateral.tokenAddress != address(0),
        string(
          abi.encodePacked(
            'RoyaltyLoan: Invalid collateral token address at position ',
            i.toString()
          )
        )
      );

      require(
        collateral.tokenAmount > 0,
        string(
          abi.encodePacked(
            'RoyaltyLoan: Collateral amount must be greater than 0 at position ',
            i.toString()
          )
        )
      );

      require(
        IERC1155(collateral.tokenAddress).balanceOf(
          address(this),
          collateral.tokenId
        ) == collateral.tokenAmount,
        string(
          abi.encodePacked(
            'RoyaltyLoan: Collateral was not transferred in the required amount at position ',
            i.toString()
          )
        )
      );

      collaterals.push(collateral);
    }
    require(_loanAmount > 0, 'RoyaltyLoan: Loan amount must be greater than 0');
    require(_feePpm <= 1_000_000, 'RoyaltyLoan: FeePpm exceeds 100%');
    require(
      _paymentTokenAddress != address(0),
      'RoyaltyLoan: Invalid payment token address'
    );
    require(_duration > 0, 'RoyaltyLoan: Duration must be greater than 0');

    paymentToken = IERC20(_paymentTokenAddress);
    borrower = _borrowerAddress;
    feePpm = _feePpm;
    loanAmount = _loanAmount;
    _totalDue = loanAmount + ((loanAmount * feePpm) / 1_000_000);
    expirationDate = block.timestamp + _duration;
    loanOfferActive = true;
  }

  function provideLoan() external {
    require(loanActive == false, 'RoyaltyLoan: Loan is already active');
    require(loanOfferActive == true, 'RoyaltyLoan: Loan offer is revoked');
    require(
      block.timestamp <= expirationDate,
      'RoyaltyLoan: Loan offer expired'
    );

    lender = msg.sender;
    paymentToken.safeTransferFrom(msg.sender, borrower, loanAmount);

    loanActive = true;
    loanOfferActive = false;

    emit LoanProvided(lender);
  }

  function claimCollateralBalance(address _collateralTokenAddress) private {
    if (paymentToken.balanceOf(_collateralTokenAddress) > 0) {
      IAgreementERC1155(_collateralTokenAddress).claimHolderFunds(
        address(this),
        address(paymentToken)
      );
    }
  }

  function processRepayment() external {
    require(loanActive == true, 'RoyaltyLoan: Loan is inactive');

    for (uint i = 0; i < collaterals.length; i++) {
      claimCollateralBalance(collaterals[i].tokenAddress);
    }

    uint256 currentBalance = paymentToken.balanceOf(address(this));
    require(currentBalance > 0, 'RoyaltyLoan: No payment token to process');

    if (currentBalance >= _totalDue) {
      // Full repayment
      for (uint i = 0; i < collaterals.length; i++) {
        IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
          address(this),
          borrower,
          collaterals[i].tokenId,
          collaterals[i].tokenAmount,
          ''
        );
      }

      require(
        paymentToken.transfer(lender, _totalDue),
        'RoyaltyLoan: Due USDC transfer failed'
      );

      if (currentBalance > _totalDue) {
        uint256 excess = currentBalance - _totalDue;
        require(
          paymentToken.transfer(borrower, excess),
          'RoyaltyLoan: Excess USDC transfer failed'
        );
      }

      emit LoanRepaid(_totalDue);

      _totalDue = 0;
      loanActive = false;
    } else {
      // Partial repayment
      _totalDue = _totalDue - currentBalance;
      require(
        paymentToken.transfer(lender, currentBalance),
        'RoyaltyLoan: Partial USDC transfer failed'
      );

      emit LoanPartialyRepaid(currentBalance);
    }
  }

  function getRemainingTotalDue() external view returns (uint256) {
    require(loanActive == true, 'RoyaltyLoan: Loan is inactive');
    require(
      msg.sender == borrower || msg.sender == lender,
      'RoyaltyLoan: Only borrower and lender can see remaining total due'
    );

    return _totalDue;
  }

  function reclaimExcessPaymentToken() external {
    require(loanActive == false, 'RoyaltyLoan: Loan is active');
    uint256 currentBalance = paymentToken.balanceOf(address(this));
    require(currentBalance > 0, 'RoyaltyLoan: No payment token to process');
    require(
      paymentToken.transfer(borrower, currentBalance),
      'RoyaltyLoan: Reclaim failed'
    );
  }

  function revokeLoan() external {
    require(loanActive == false, 'RoyaltyLoan: Loan is already active');
    require(loanOfferActive == true, 'RoyaltyLoan: Loan offer is revoked');
    require(
      msg.sender == borrower,
      'RoyaltyLoan: Only borrower can revoke the loan'
    );

    for (uint i = 0; i < collaterals.length; i++) {
      IERC1155(collaterals[i].tokenAddress).safeTransferFrom(
        address(this),
        borrower,
        collaterals[i].tokenId,
        collaterals[i].tokenAmount,
        ''
      );
    }

    uint256 currentBalance = paymentToken.balanceOf(address(this));
    if (currentBalance > 0) {
      require(
        paymentToken.transfer(borrower, currentBalance),
        'RoyaltyLoan: USDC transfer failed'
      );
    }

    loanOfferActive = false;
    emit LoanRevoked();
  }
}
