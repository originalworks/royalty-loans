// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.32;

interface ICollateral {
  struct Collateral {
    address tokenAddress;
    uint256 tokenId;
    uint256 tokenAmount;
  }
}
