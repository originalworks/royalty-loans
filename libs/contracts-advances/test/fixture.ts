import hre, { ethers } from 'hardhat';
import {
  AgreementERC1155,
  AgreementERC20,
  AgreementERC20__factory,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyAdvance__factory,
  RoyaltyAdvanceFactory__factory,
} from '../typechain';

import {
  deployInitialSetup,
  getEvent,
} from '@royalty-loans/contracts-agreements';
import { deployProxy } from '@royalty-loans/contracts-shared';

import { AddressLike, BigNumberish } from 'ethers';
import { ICollateral } from '../typechain/contracts/Advances/interfaces/IRoyaltyAdvance';
import { createAdvanceCreator, deployAgreementERC1155Creator } from './utils';

export enum RoyaltyAdvanceError {
  NoCollateralsProvided = 'NoCollateralsProvided',
  ZeroCollateralTokenAddress = 'ZeroCollateralTokenAddress',
  ZeroCollateralAmount = 'ZeroCollateralAmount',
  CollateralNotTransferred = 'CollateralNotTransferred',
  ZeroAdvanceAmount = 'ZeroAdvanceAmount',
  FeePpmTooHigh = 'FeePpmTooHigh',
  ZeroPaymentTokenAddress = 'ZeroPaymentTokenAddress',
  ZeroDuration = 'ZeroDuration',
  AdvanceAlreadyActive = 'AdvanceAlreadyActive',
  AdvanceOfferExpired = 'AdvanceOfferExpired',
  AdvanceOfferRevoked = 'AdvanceOfferRevoked',
  AdvanceNotActive = 'AdvanceNotActive',
  NoPaymentTokenToProcess = 'NoPaymentTokenToProcess',
  OnlyRecipientAllowed = 'OnlyRecipientAllowed',
  ZeroCollateralReceiverAddress = 'ZeroCollateralReceiverAddress',
}

export enum RoyaltyAdvanceFactoryError {
  ZeroTemplateAddress = 'ZeroTemplateAddress',
  ZeroDuration = 'ZeroDuration',
  ZeroPaymentTokenAddress = 'ZeroPaymentTokenAddress',
  ZeroMaxCollateralsPerAdvance = 'ZeroMaxCollateralsPerAdvance',
  NotAgreementFactory = 'NotAgreementFactory',
  ZeroCollateralTokenAddress = 'ZeroCollateralTokenAddress',
  CollateralNotERC1155 = 'CollateralNotERC1155',
  CollateralNotRegistered = 'CollateralNotRegistered',
  TooManyCollaterals = 'TooManyCollaterals',
}

export type HolderStruct = {
  account: AddressLike;
  isAdmin: boolean;
  balance: BigNumberish;
};

export const AdvanceState = {
  Uninitialized: 0n,
  Pending: 1n,
  Revoked: 2n,
  Active: 3n,
  Repaid: 4n,
};

export const defaults = {
  collateralTokenId: 1n,
  collateralAmount: 1000n,
  feePpm: 200000n,
  advanceAmount: ethers.parseUnits('10', 6), // 10 USDC
  feeAmount: (ethers.parseUnits('10', 6) * 200000n) / 1000000n, // 2 USDC
  duration: 10n, // 10s,
};

export type RoyaltyAdvanceInitArgs = {
  collaterals: ICollateral.CollateralStruct[];
  paymentTokenAddress: AddressLike;
  recipientAddress: AddressLike;
  feePpm: BigNumberish;
  advanceAmount: BigNumberish;
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

  const [deployer, advancer] = signers;

  const { splitCurrencies, agreementFactory } = await deployInitialSetup({
    creationFee: 0n,
    paymentFee: 0n,
  });

  const lendingToken = splitCurrencies[0].contract;

  if (!lendingToken) {
    throw new Error('No lending token');
  }

  const deployAgreementERC1155 = deployAgreementERC1155Creator(
    deployer,
    await agreementFactory.getAddress(),
  );

  const deployAgreementERC20 = async (holders: HolderStruct[]) => {
    const tx = agreementFactory.connect(deployer).createERC20(
      {
        holders,
        unassignedRwaId: 'ABC123',
      },
      { value: 0n },
    );
    const event = await getEvent(tx, agreementFactory, 'AgreementCreated');
    const agreementAddress = event.args[0];
    const agreement = AgreementERC20__factory.connect(
      agreementAddress,
    ) as AgreementERC20;

    return agreement;
  };

  const paymentToken = ERC20TokenMock__factory.connect(
    await lendingToken.getAddress(),
    deployer,
  );

  const advanceTemplate = await (
    await new RoyaltyAdvance__factory(deployer).deploy()
  ).waitForDeployment();

  const advanceFactory = await deployProxy(
    new RoyaltyAdvanceFactory__factory(deployer),
    [
      await advanceTemplate.getAddress(),
      await paymentToken.getAddress(),
      await agreementFactory.getAddress(),
      defaults.duration,
      200n,
    ],
  );

  await advanceFactory.waitForDeployment();

  return {
    signers,
    defaults,
    advanceTemplate,
    advanceFactory,
    agreementFactory,
    deployAgreementERC1155,
    deployAgreementERC20,
    paymentToken,
    getCurrentBalances: getCurrentBalancesCreator(paymentToken),
    createAdvance: createAdvanceCreator({
      advanceFactory,
      paymentToken,
      advancer,
    }),
  };
};
