import hre, { ethers } from 'hardhat';
import {
  AgreementERC1155,
  AgreementERC1155__factory,
  BeneficiaryRoyaltyLoan__factory,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory__factory,
} from '../typechain';

import {
  deployInitialSetup,
  getEvent,
} from '@royalty-loans/contracts-agreements';
import { deployProxy } from '@royalty-loans/contracts-shared';

import { AddressLike, BigNumberish } from 'ethers';
import { ICollateral } from '../typechain/contracts/Loans/interfaces/IRoyaltyLoan';
import { createLoanCreator } from './utils';

export type HolderStruct = {
  account: AddressLike;
  isAdmin: boolean;
  balance: BigNumberish;
};

export const LoanState = {
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

  const { splitCurrencies, agreementFactory } = await deployInitialSetup({
    creationFee: 0n,
    paymentFee: 0n,
  });

  const lendingToken = splitCurrencies[0].contract;

  if (!lendingToken) {
    throw new Error('No lending token');
  }

  const deployAgreementERC1155 = async (holders: HolderStruct[]) => {
    const tx = agreementFactory.connect(deployer).createERC1155(
      {
        tokenUri: 'tokenUri',
        contractURI: 'contractURI',
        holders,
        unassignedRwaId: 'ABC123',
      },
      { value: 0n },
    );
    const event = await getEvent(tx, agreementFactory, 'AgreementCreated');
    const agreementAddress = event.args[0];
    const agreement = AgreementERC1155__factory.connect(
      agreementAddress,
    ) as AgreementERC1155;

    return agreement;
  };

  const paymentToken = ERC20TokenMock__factory.connect(
    await lendingToken.getAddress(),
    deployer,
  );

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
      await paymentToken.getAddress(),
      defaults.duration,
    ],
  );

  await loanFactory.waitForDeployment();

  return {
    signers,
    defaults,
    standardLoanTemplate,
    beneficiaryLoanTemplate,
    loanFactory,
    deployAgreementERC1155,
    paymentToken,
    getCurrentBalances: getCurrentBalancesCreator(paymentToken),
    createLoan: createLoanCreator({ loanFactory, paymentToken, lender }),
  };
};
