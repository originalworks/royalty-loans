import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumberish, ethers } from 'ethers';
import {
  RoyaltyLoanFactory,
  ERC20TokenMock,
  AgreementERC1155,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  BeneficiaryRoyaltyLoan__factory,
} from '../typechain';
import { ICollateral } from '../typechain/contracts/Loans/RoyaltyLoan';
import {
  BeneficiaryRoyaltyLoan,
  ICollateral as ICollateralWithBeneficiaries,
} from '../typechain/contracts/Loans/BeneficiaryRoyaltyLoan';
import { defaults } from './fixture';

export const createLoanCreator = (args: {
  loanFactory: RoyaltyLoanFactory;
  paymentToken: ERC20TokenMock;
  lender: SignerWithAddress;
}) => ({
  standard: createStandardLoanCreator(args),
  beneficiary: createBeneficiaryLoanCreator(args),
});

const createStandardLoanCreator =
  ({
    loanFactory,
    paymentToken,
    lender,
  }: {
    loanFactory: RoyaltyLoanFactory;
    paymentToken: ERC20TokenMock;
    lender: SignerWithAddress;
  }) =>
  async (
    borrower: SignerWithAddress,
    collateralsWithOpts: {
      collateralToken: AgreementERC1155;
      collateralAmount?: BigNumberish;
    }[],
    overrides?: {
      loanAmount?: BigNumberish;
      feePpm?: BigNumberish;
    },
  ): Promise<RoyaltyLoan> => {
    const collaterals: ICollateral.CollateralStruct[] = [];

    for (const coll of collateralsWithOpts) {
      await (
        await coll.collateralToken
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), true)
      ).wait();

      collaterals.push({
        tokenAddress: await coll.collateralToken.getAddress(),
        tokenAmount: coll.collateralAmount ?? defaults.collateralAmount,
        tokenId: defaults.collateralTokenId,
      });
    }

    const receipt = await (
      await loanFactory
        .connect(borrower)
        .createLoanContract(
          collaterals,
          overrides?.loanAmount ?? defaults.loanAmount,
          overrides?.feePpm ?? defaults.feePpm,
        )
    ).wait();

    const loanContractAddress = (
      await loanFactory.queryFilter(
        loanFactory.getEvent('LoanContractCreated'),
        receipt?.blockNumber,
        receipt?.blockNumber,
      )
    )[0].args.loanContract;

    const royaltyLoan = RoyaltyLoan__factory.connect(
      loanContractAddress,
      borrower,
    );

    await (
      await paymentToken
        .connect(lender)
        .approve(loanContractAddress, ethers.MaxUint256)
    ).wait();

    return royaltyLoan;
  };

const createBeneficiaryLoanCreator =
  ({
    loanFactory,
    paymentToken,
    lender,
  }: {
    loanFactory: RoyaltyLoanFactory;
    paymentToken: ERC20TokenMock;
    lender: SignerWithAddress;
  }) =>
  async (
    borrower: SignerWithAddress,
    collateralsWithOpts: {
      collateralToken: AgreementERC1155;
      collateralAmount?: BigNumberish;
      beneficiaries: ICollateralWithBeneficiaries.BeneficiaryStruct[];
    }[],
    overrides?: {
      loanAmount?: BigNumberish;
      feePpm?: BigNumberish;
    },
  ): Promise<BeneficiaryRoyaltyLoan> => {
    const collaterals: ICollateralWithBeneficiaries.CollateralWithBeneficiariesStruct[] =
      [];

    for (const coll of collateralsWithOpts) {
      await (
        await coll.collateralToken
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), true)
      ).wait();

      collaterals.push({
        tokenAddress: await coll.collateralToken.getAddress(),
        tokenAmount: coll.collateralAmount ?? defaults.collateralAmount,
        tokenId: defaults.collateralTokenId,
        beneficiaries: coll.beneficiaries,
      });
    }

    const receipt = await (
      await loanFactory
        .connect(borrower)
        .createBeneficiaryLoanContract(
          collaterals,
          overrides?.loanAmount ?? defaults.loanAmount,
          overrides?.feePpm ?? defaults.feePpm,
        )
    ).wait();

    const loanContractAddress = (
      await loanFactory.queryFilter(
        loanFactory.getEvent('BeneficiaryLoanContractCreated'),
        receipt?.blockNumber,
        receipt?.blockNumber,
      )
    )[0].args.loanContract;

    const royaltyLoan = BeneficiaryRoyaltyLoan__factory.connect(
      loanContractAddress,
      borrower,
    );

    await (
      await paymentToken
        .connect(lender)
        .approve(loanContractAddress, ethers.MaxUint256)
    ).wait();

    return royaltyLoan;
  };
