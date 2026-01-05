// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ICollateral {
  struct Collateral {
    address tokenAddress;
    uint256 tokenId;
    uint256 tokenAmount;
  }

  struct Beneficiary {
    address beneficiaryAddress;
    uint32 ppm;
  }

  struct CollateralWithBeneficiaries {
    address tokenAddress;
    uint256 tokenId;
    uint256 tokenAmount;
    Beneficiary[] beneficiaries;
  }
}
