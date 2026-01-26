import { Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { getImplementationAddressFromProxy } from '@openzeppelin/upgrades-core';

export const deployRoyaltyLoanFactory = async (
  deployer: Signer,
  paymentTokenAddress: string,
  agreementFactoryAddress: string,
) => {
  const StandardRoyaltyLoan = await ethers.getContractFactory(
    'RoyaltyLoan',
    deployer,
  );
  const standardRoyaltyLoan = await (
    await StandardRoyaltyLoan.deploy()
  ).waitForDeployment();
  const standardRoyaltyLoanTemplate = await standardRoyaltyLoan.getAddress();

  const BeneficiaryRoyaltyLoan = await ethers.getContractFactory(
    'BeneficiaryRoyaltyLoan',
    deployer,
  );
  const beneficiaryRoyaltyLoan = await (
    await BeneficiaryRoyaltyLoan.deploy()
  ).waitForDeployment();
  const beneficiaryRoyaltyLoanTemplate =
    await beneficiaryRoyaltyLoan.getAddress();

  const RoyaltyLoanFactory = await ethers.getContractFactory(
    'RoyaltyLoanFactory',
    deployer,
  );

  const royaltyLoanFactory = await upgrades.deployProxy(
    RoyaltyLoanFactory,
    [
      standardRoyaltyLoanTemplate,
      beneficiaryRoyaltyLoanTemplate,
      paymentTokenAddress,
      agreementFactoryAddress,
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
    standardRoyaltyLoanTemplate,
    beneficiaryRoyaltyLoanTemplate,
    royaltyLoanFactory: await royaltyLoanFactory.getAddress(),
  };
};
