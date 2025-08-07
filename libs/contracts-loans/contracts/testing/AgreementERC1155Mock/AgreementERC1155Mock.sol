// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';
import '../../Loans/IAgreementERC1155.sol';
// To be able to deploy it with tests
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';

contract AgreementERC1155Mock is
  ERC1155Upgradeable,
  ERC1155HolderUpgradeable,
  IAgreementERC1155
{
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(string memory uri) public initializer {
    __ERC1155_init(uri);
  }

  function mint(address to, uint256 id, uint256 amount) external {
    _mint(to, id, amount, '');
  }

  function isAdmin(address user) public pure returns (bool) {
    if (user == address(0)) {
      return true;
    }

    return false;
  }

  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(ERC1155HolderUpgradeable, ERC1155Upgradeable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
