import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumberish, ethers, HDNodeWallet, Wallet } from 'ethers';
import {
  RoyaltyLoanFactory,
  ERC20TokenMock,
  AgreementERC1155,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  BeneficiaryRoyaltyLoan__factory,
  AgreementFactory__factory,
  AgreementERC1155__factory,
} from '../typechain';
import { ICollateral } from '../typechain/contracts/Loans/RoyaltyLoan';
import {
  BeneficiaryRoyaltyLoan,
  ICollateral as ICollateralWithBeneficiaries,
} from '../typechain/contracts/Loans/BeneficiaryRoyaltyLoan';
import { defaults, HolderStruct } from './fixture';
import { getEvent } from '@royalty-loans/contracts-agreements';

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

type ExpectedBalance = {
  address: string;
  addressLabel?: string;
  erc20?: bigint;
  erc1155?: bigint;
};

export const expectBalancesCreator =
  (expect: Chai.ExpectStatic, paymentToken: ERC20TokenMock) =>
  async (
    collateralToken: AgreementERC1155,
    expectations: ExpectedBalance[],
  ) => {
    for (const expectation of expectations) {
      const {
        address,
        erc1155: expectedErc1155,
        erc20: expectedErc20,
        addressLabel,
      } = expectation;
      const gotERC1155 = expectedErc1155 !== undefined;
      const gotERC20 = expectedErc20 !== undefined;

      if (!gotERC1155 && !gotERC20) {
        throw new Error('You forgot something');
      }

      if (gotERC1155) {
        const actualErc1155 = await collateralToken.balanceOf(
          address,
          defaults.collateralTokenId,
        );

        expect(
          actualErc1155,
          `ERC1155 balance mismatch | address: ${addressLabel || address} | expected: ${expectedErc1155} | received: ${actualErc1155}`,
        ).to.equal(expectedErc1155);
      }

      if (gotERC20) {
        const actualErc20 = await paymentToken.balanceOf(address);
        expect(
          actualErc20,
          `ERC20 balance mismatch | address: ${addressLabel || address} | expected: ${expectedErc20} | received: ${actualErc20}`,
        ).to.equal(expectedErc20);
      }
    }
  };

export const deployAgreementERC1155Creator = (
  deployer: SignerWithAddress,
  factoryAddress: string,
) => {
  return async (holders: HolderStruct[]) => {
    const agreementFactory = AgreementFactory__factory.connect(
      factoryAddress,
      deployer,
    );
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
};

export const createManyWallets = () => {
  const wallets: HDNodeWallet[] = [];

  for (let i = 0; i < 500; i++) {
    wallets.push(Wallet.createRandom());
  }

  return wallets;
};
