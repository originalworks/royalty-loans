import hre, { ethers } from 'hardhat';
import {
  AgreementERC1155,
  BeneficiaryRoyaltyLoan__factory,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory__factory,
  Whitelist__factory,
} from '../typechain';

import { deployAgreementsTestFixture } from '@royalty-loans/contracts-agreements';
import { deployProxy } from '@royalty-loans/contracts-shared';

import { AddressLike, BigNumberish, JsonRpcProvider, Signer } from 'ethers';
import { ICollateral } from '../typechain/contracts/Loans/interfaces/IRoyaltyLoan';
import { createLoanCreator } from './utils';

export type HolderStruct = {
  account: AddressLike;
  isAdmin: boolean;
  balance: BigNumberish;
};

export const defaults = {
  collateralTokenId: 1n,
  collateralAmount: 1000n,
  feePpm: 200000n,
  loanAmount: ethers.parseUnits('10', 6), // 10 USDC
  feeAmount: (ethers.parseUnits('10', 6) * 200000n) / 1000000n, // 2 USDC
  duration: 10n, // 10s,
};

export type RoyaltyLoanInitArgs = {
  collaterals: ICollateral.CollateralStruct[];
  paymentTokenAddress: AddressLike;
  borrowerAddress: AddressLike;
  feePpm: BigNumberish;
  loanAmount: BigNumberish;
  duration: BigNumberish;
};

const getCurrentBalancesCreator =
  (paymentToken: ERC20TokenMock) =>
  async (
    collateralToken: AgreementERC1155,
    addresses: string[],
  ): Promise<{ ERC20: bigint; ERC1155: bigint }[]> => {
    const results: { ERC20: bigint; ERC1155: bigint }[] = [];
    for (const address of addresses) {
      const ERC1155 = await collateralToken.balanceOf(
        address,
        defaults.collateralTokenId,
      );
      const ERC20 = await paymentToken.balanceOf(address);

      results.push({ ERC1155, ERC20 });
    }
    return results;
  };

export const fixture = async () => {
  const signers = await hre.ethers.getSigners();

  const [deployer, lender] = signers;

  const {
    splitCurrencies: { lendingToken },
    deployAgreementERC1155: deployAgreementERC1155Base,
  } = await deployAgreementsTestFixture(
    deployer as Signer,
    deployer.provider as JsonRpcProvider,
    { creationFee: 0n, paymentFee: 0n },
  );

  // Because of ts issues
  const deployAgreementERC1155: (
    holders: HolderStruct[],
  ) => Promise<AgreementERC1155> = deployAgreementERC1155Base;

  const paymentToken = ERC20TokenMock__factory.connect(
    lendingToken.address,
    deployer,
  );
  const whitelist = await new Whitelist__factory(deployer).deploy(
    deployer.address,
  );
  await (await whitelist.addToWhitelist(deployer)).wait();

  // TO PÓJDZIE DO POSZCZEGÓLNYCH TESTÓW
  // const collateralTokenA = (
  //   await deployAgreementERC1155([
  //     {
  //       account: borrower.address,
  //       balance: defaults.collateralAmount,
  //       isAdmin: true,
  //     },
  //   ])
  // ).connect(deployer);

  // const collateralTokenB = (
  //   await deployAgreementERC1155([
  //     {
  //       account: borrower.address,
  //       balance: defaults.collateralAmount * 3n,
  //       isAdmin: true,
  //     },
  //   ])
  // ).connect(deployer);

  const standardLoanTemplate = await (
    await new RoyaltyLoan__factory(deployer).deploy()
  ).waitForDeployment();

  const beneficiaryLoanTemplate = await (
    await new BeneficiaryRoyaltyLoan__factory(deployer).deploy()
  ).waitForDeployment();

  const loanFactory = await deployProxy(
    new RoyaltyLoanFactory__factory(deployer),
    [
      await standardLoanTemplate.getAddress(),
      await beneficiaryLoanTemplate.getAddress(),
      await whitelist.getAddress(),
      await paymentToken.getAddress(),
      defaults.duration,
    ],
  );

  await loanFactory.waitForDeployment();

  return {
    signers,
    defaults,
    whitelist,
    standardLoanTemplate,
    beneficiaryLoanTemplate,
    loanFactory,
    deployAgreementERC1155,
    paymentToken,
    getCurrentBalances: getCurrentBalancesCreator(paymentToken),
    createLoan: createLoanCreator({ loanFactory, paymentToken, lender }),
  };
};
