import hre, { ethers } from 'hardhat';
import {
  AgreementERC1155,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory,
  RoyaltyLoanFactory__factory,
  TestRoyaltyLoanFactory__factory,
  Whitelist__factory,
} from '../typechain';

import type { ICollateral } from '../typechain/contracts/Loans/RoyaltyLoan';
import { deployAgreementsTestFixture } from '@royalty-loans/contracts-agreements';
import { deployProxy } from '@royalty-loans/contracts-shared';

import { AddressLike, BigNumberish, JsonRpcProvider, Signer } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

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

export const getCurrentBalancesCreator =
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

const createLoanWithFactoryCreator =
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
      noApprove?: boolean;
    }[],
    overrides?: {
      loanAmount?: BigNumberish;
      feePpm?: BigNumberish;
    },
  ): Promise<RoyaltyLoan> => {
    const collaterals: ICollateral.CollateralStruct[] = [];

    for (const coll of collateralsWithOpts) {
      if (!coll.noApprove) {
        await (
          await coll.collateralToken
            .connect(borrower)
            .setApprovalForAll(await loanFactory.getAddress(), true)
        ).wait();
      }

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

export const fixture = async () => {
  const [deployer, borrower, lender] = await hre.ethers.getSigners();

  const {
    splitCurrencies: { lendingToken },
    deployAgreementERC1155,
  } = await deployAgreementsTestFixture(
    deployer as Signer,
    deployer.provider as JsonRpcProvider,
    { creationFee: 0n, paymentFee: 0n },
  );

  const paymentToken = ERC20TokenMock__factory.connect(
    lendingToken.address,
    deployer,
  );
  const whitelist = await new Whitelist__factory(deployer).deploy(
    deployer.address,
  );
  await (await whitelist.addToWhitelist(deployer)).wait();

  const collateralTokenA = (
    await deployAgreementERC1155([
      {
        account: borrower.address,
        balance: defaults.collateralAmount,
        isAdmin: true,
      },
    ])
  ).connect(deployer);

  const collateralTokenB = (
    await deployAgreementERC1155([
      {
        account: borrower.address,
        balance: defaults.collateralAmount * 3n,
        isAdmin: true,
      },
    ])
  ).connect(deployer);

  const loanTemplate = await (
    await new RoyaltyLoan__factory(deployer).deploy()
  ).waitForDeployment();

  const loanFactory = await deployProxy(
    new RoyaltyLoanFactory__factory(deployer),
    [
      await loanTemplate.getAddress(),
      await whitelist.getAddress(),
      await paymentToken.getAddress(),
      defaults.duration,
    ],
  );

  await loanFactory.waitForDeployment();

  const fakeLoanFactory = await deployProxy(
    new TestRoyaltyLoanFactory__factory(deployer),
    [
      await loanTemplate.getAddress(),
      await whitelist.getAddress(),
      await paymentToken.getAddress(),
      defaults.duration,
    ],
  );

  return {
    signers: [deployer, borrower, lender],
    defaults,
    whitelist,
    loanTemplate,
    loanFactory,
    fakeLoanFactory,
    collaterals: {
      collateralTokenA,
      collateralTokenB,
    },
    paymentToken,
    getCurrentBalances: getCurrentBalancesCreator(paymentToken),
    createLoanWithFactory: createLoanWithFactoryCreator({
      loanFactory,
      paymentToken,
      lender,
    }),
  };
};
