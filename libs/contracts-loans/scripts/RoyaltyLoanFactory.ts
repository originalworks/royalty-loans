import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { getImplementationAddressFromProxy } from '@openzeppelin/upgrades-core';

export const deployRoyaltyLoanFactory = async (
  deployer: Signer,
  paymentTokenAddress: string,
  agreementFactoryAddress: string,
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
      paymentTokenAddress,
      agreementFactoryAddress,
      '432000',
      100n,
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
    royaltyLoanTemplate,
    royaltyLoanFactory: await royaltyLoanFactory.getAddress(),
  };
};
