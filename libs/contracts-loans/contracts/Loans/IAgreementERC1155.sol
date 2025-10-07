// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IAgreementERC1155 {
  function claimHolderFunds(address holder, address currency) external;
}
