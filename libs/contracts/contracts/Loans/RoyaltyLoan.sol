// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import './IRoyaltyLoan.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract RoyaltyLoan is IRoyaltyLoan, ERC1155Holder, Initializable {
  using SafeERC20 for IERC20;

  IERC1155 public collateralToken;
  uint256 public collateralTokenId;
  uint256 public collateralAmount;
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
    address _collateralTokenAddress,
    uint256 _collateralTokenId,
    uint256 _collateralAmount,
    address _paymentTokenAddress,
    address _borrowerAddress,
    uint256 _feePpm,
    uint256 _loanAmount,
    uint256 _duration
  ) public initializer {
    require(
      _collateralTokenAddress != address(0),
      'RoyaltyLoan: Invalid collateral token address'
    );
    require(
      _collateralAmount > 0,
      'RoyaltyLoan: Collateral amount must be greater than 0'
    );
    require(_loanAmount > 0, 'RoyaltyLoan: Loan amount must be greater than 0');
    require(_feePpm <= 1_000_000, 'RoyaltyLoan: FeePpm exceeds 100%');
    require(
      _paymentTokenAddress != address(0),
      'RoyaltyLoan: Invalid payment token address'
    );
    require(_duration > 0, 'RoyaltyLoan: Duration must be greater than 0');

    collateralToken = IERC1155(_collateralTokenAddress);
    collateralTokenId = _collateralTokenId;
    collateralAmount = _collateralAmount;

    require(
      collateralToken.balanceOf(address(this), collateralTokenId) ==
        collateralAmount,
      'RoyaltyLoan: Collateral was not transferred in the required amount'
    );
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

  function processRepayment() external {
    require(loanActive == true, 'RoyaltyLoan: Loan is inactive');
    uint256 currentBalance = paymentToken.balanceOf(address(this));
    require(currentBalance > 0, 'RoyaltyLoan: No payment token to process');

    if (currentBalance >= _totalDue) {
      // Full repayment
      collateralToken.safeTransferFrom(
        address(this),
        borrower,
        collateralTokenId,
        collateralAmount,
        ''
      );

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
    collateralToken.safeTransferFrom(
      address(this),
      borrower,
      collateralTokenId,
      collateralAmount,
      ''
    );
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
