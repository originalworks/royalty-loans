import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { getImplementationAddressFromProxy } from '@openzeppelin/upgrades-core';

export const deployRoyaltyLoanFactory = async (
  deployer: Signer,
  whitelistAddress: string,
) => {
  const RoyaltyLoan = await ethers.getContractFactory('RoyaltyLoan', deployer);
  const royaltyLoan = await (await RoyaltyLoan.deploy()).waitForDeployment();
  const royaltyLoanTemplate = await royaltyLoan.getAddress();

  const RoyaltyLoanFactory = await ethers.getContractFactory(
    'RoyaltyLoanFactory',
    deployer,
  );

  const royaltyLoanFactory = await upgrades.deployProxy(
    RoyaltyLoanFactory,
    [
      royaltyLoanTemplate,
      whitelistAddress,
      '0x46Bc2338a282383fe2585Ef5F0171E62FdCEf3B0',
      '432000',
    ],
    {
      kind: 'uups',
    },
  );

  await royaltyLoanFactory.waitForDeployment();

  const implementationAddress = getImplementationAddressFromProxy(
    ethers.provider,
    await royaltyLoanFactory.getAddress(),
  );

  if (!implementationAddress) {
    throw new Error('Implementation address not found');
  }

  return {
    royaltyLoanTemplate: royaltyLoanTemplate,
    royaltyLoanFactory: await royaltyLoanFactory.getAddress(),
  };
};
