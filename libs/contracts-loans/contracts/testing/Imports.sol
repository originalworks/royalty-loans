// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@royalty-loans/contracts-agreements/contracts/agreements/AgreementFactory.sol';
import '@royalty-loans/contracts-agreements/contracts/agreements/AgreementERC1155.sol';
import '@royalty-loans/contracts-agreements/contracts/agreements/AgreementERC20.sol';
import '@royalty-loans/contracts-agreements/contracts/AgreementRelationsRegistry.sol';
import '@royalty-loans/contracts-agreements/contracts/FallbackVault.sol';
import '@royalty-loans/contracts-agreements/contracts/FeeManager.sol';
import '@royalty-loans/contracts-agreements/contracts/NamespaceRegistry.sol';
