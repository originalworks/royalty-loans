import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { getImplementationAddressFromProxy } from '@openzeppelin/upgrades-core';

export const deployRoyaltyAdvanceFactory = async (
  deployer: Signer,
  paymentTokenAddress: string,
  agreementFactoryAddress: string,
) => {
  const RoyaltyAdvance = await ethers.getContractFactory(
    'RoyaltyAdvance',
    deployer,
  );
  const royaltyAdvance = await (
    await RoyaltyAdvance.deploy()
  ).waitForDeployment();
  const royaltyAdvanceTemplate = await royaltyAdvance.getAddress();

  const RoyaltyAdvanceFactory = await ethers.getContractFactory(
    'RoyaltyAdvanceFactory',
    deployer,
  );

  const royaltyAdvanceFactory = await upgrades.deployProxy(
    RoyaltyAdvanceFactory,
    [
      royaltyAdvanceTemplate,
      paymentTokenAddress,
      agreementFactoryAddress,
      '432000',
      100n,
    ],
    {
      kind: 'uups',
    },
  );

  await royaltyAdvanceFactory.waitForDeployment();

  const implementationAddress = getImplementationAddressFromProxy(
    ethers.provider,
    await royaltyAdvanceFactory.getAddress(),
  );

  if (!implementationAddress) {
    throw new Error('Implementation address not found');
  }

  return {
    royaltyAdvanceTemplate,
    royaltyAdvanceFactory: await royaltyAdvanceFactory.getAddress(),
  };
};
