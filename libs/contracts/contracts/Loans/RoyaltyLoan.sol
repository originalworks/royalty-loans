// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import '../interfaces/IRoyaltyLoan.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/**
 * @title Loan
 * @notice This contract is a placeholder for the Loan contract.
 */

contract RoyaltyLoan is
  IRoyaltyLoan,
  ERC1155Holder,
  ReentrancyGuardUpgradeable
{
  address public usdc;
  address public collateralTokenAddress;
  address public borrower;
  address public lender;
  uint256 public fee;
  uint256 public loanAmount;
  uint256 public collateralTokenId;
  uint256 public collateralAmount;
  uint256 public expirationDate;

  bool public loanProvided = false;
  bool public loanOfferActive = false;

  constructor() {
    _disableInitializers();
  }

  modifier isLoanNotYetProvided() {
    require(loanProvided == false, 'Loan is already provided');
    _;
  }

  modifier isLoanActive() {
    require(loanOfferActive == true, 'Loan offer is revoked');
    _;
  }

  function initialize(
    address _usdc,
    address _collateralToken,
    address _borrower,
    uint256 _fee,
    uint256 _collateralTokenId,
    uint256 _collateralAmount,
    uint256 _loanAmount,
    uint256 _duration
  ) public initializer {
    __ReentrancyGuard_init();

    require(_usdc != address(0), 'Invalid USDC address');
    usdc = _usdc;
    collateralTokenAddress = _collateralToken;

    borrower = _borrower;
    fee = _fee;
    collateralTokenId = _collateralTokenId;
    collateralAmount = _collateralAmount;
    loanAmount = _loanAmount;
    expirationDate = block.timestamp + _duration;
    loanOfferActive = true;
  }

  function provideLoan()
    external
    isLoanNotYetProvided
    isLoanActive
    nonReentrant
  {
    require(block.timestamp <= expirationDate, 'Loan offer expired');
    require(
      IERC1155(collateralTokenAddress).balanceOf(
        address(this),
        collateralTokenId
      ) == collateralAmount,
      'Collateral was not transferred in the required amount'
    );
    lender = msg.sender;
    IERC20(usdc).transferFrom(msg.sender, borrower, loanAmount);

    loanProvided = true;
    loanOfferActive = false;

    emit LoanProvided(lender, loanAmount);
  }

  function processRepayment() external nonReentrant {
    require(loanProvided == true, 'Loan is not provided');
    uint256 currentBalance = IERC20(usdc).balanceOf(address(this));
    require(currentBalance > 0, 'No USDC to process');

    uint256 totalDue = loanAmount + fee;

    if (currentBalance >= totalDue) {
      // Full repayment
      // Return collateral
      IERC1155(collateralTokenAddress).safeTransferFrom(
        address(this),
        borrower,
        collateralTokenId,
        collateralAmount,
        ''
      );

      emit CollateralReturned(collateralTokenAddress, collateralAmount);

      // Send due amount to lender
      require(
        IERC20(usdc).transfer(lender, totalDue),
        'Due USDC transfer failed'
      );

      // Return excess USDC if any
      if (currentBalance > totalDue) {
        uint256 excess = currentBalance - totalDue;
        require(
          IERC20(usdc).transfer(borrower, excess),
          'Excess USDC transfer failed'
        );
      }

      emit LoanRepaid(totalDue);

      // Mark contract as inactive
      loanProvided = false;
    } else {
      // Partial repayment
      loanAmount = loanAmount - currentBalance;
      require(
        IERC20(usdc).transfer(lender, currentBalance),
        'Partial USDC transfer failed'
      );

      emit LoanPartialyRepaid(currentBalance);
    }
  }

  function revokeLoan() external isLoanNotYetProvided isLoanActive {
    require(msg.sender == borrower, 'Only borrower can revoke the loan');
    IERC1155(collateralTokenAddress).safeTransferFrom(
      address(this),
      borrower,
      collateralTokenId,
      collateralAmount,
      ''
    );
    uint256 currentBalance = IERC20(usdc).balanceOf(address(this));
    if (currentBalance > 0) {
      // Return USDC to borrower
      require(
        IERC20(usdc).transfer(borrower, currentBalance),
        'USDC transfer failed'
      );
    }

    loanOfferActive = false;
    emit LoanRevoked();
  }
}
