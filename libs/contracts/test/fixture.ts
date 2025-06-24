import hre, { ethers } from 'hardhat';
import {
  AgreementERC1155Mock,
  AgreementERC1155Mock__factory,
  ERC1967Proxy__factory,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory,
  RoyaltyLoanFactory__factory,
  Whitelist__factory,
} from '../typechain';

import { AddressLike, BigNumberish, ContractFactory } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

export const defaults = {
  collateralTokenId: 1n,
  collateralAmount: 1000n,
  feePpm: 200000n,
  loanAmount: ethers.parseUnits('10', 6), // 10 USDC
  feeAmount: (ethers.parseUnits('10', 6) * 200000n) / 1000000n,
  duration: 10n, // 10s,
};

export const deployProxy = async <T extends ContractFactory>(
  factory: T,
  initArgs: any[],
) => {
  const implementation = await factory.deploy();
  const encodedInitArgs = // @ts-expect-error fk ethers v6
    (await implementation.initialize.populateTransaction(...initArgs)).data;
  const proxy = await (
    await new ERC1967Proxy__factory(
      implementation.runner as unknown as SignerWithAddress,
    ).deploy(await implementation.getAddress(), encodedInitArgs)
  ).waitForDeployment();

  return implementation.attach(await proxy.getAddress()) as ReturnType<
    T['deploy']
  >;
};

export type RoyaltyLoanInitArgs = {
  collateralTokenAddress: AddressLike;
  collateralTokenId: BigNumberish;
  collateralAmount: BigNumberish;
  paymentTokenAddress: AddressLike;
  borrowerAddress: AddressLike;
  feePpm: BigNumberish;
  loanAmount: BigNumberish;
  duration: BigNumberish;
};

const deployLoanCreator =
  ({
    collateralToken,
    paymentToken,
  }: {
    collateralToken: AgreementERC1155Mock;
    paymentToken: ERC20TokenMock;
  }) =>
  async (
    deployer: SignerWithAddress,
    initArgsOverrides?: Partial<RoyaltyLoanInitArgs>,
  ) => {
    const initArgs: RoyaltyLoanInitArgs = {
      ...defaults,
      collateralTokenAddress: await collateralToken.getAddress(),
      paymentTokenAddress: await paymentToken.getAddress(),
      borrowerAddress: deployer.address,
      ...(initArgsOverrides || {}),
    };

    const loanContract = await deployProxy(new RoyaltyLoan__factory(deployer), [
      initArgs.collateralTokenAddress,
      initArgs.collateralTokenId,
      initArgs.collateralAmount,
      initArgs.paymentTokenAddress,
      initArgs.borrowerAddress,
      initArgs.feePpm,
      initArgs.loanAmount,
      initArgs.duration,
    ] as Parameters<RoyaltyLoan['initialize']>);

    return loanContract;
  };

const createLoanWithFactoryCreator =
  ({
    collateralToken,
    loanFactory,
    paymentToken,
    lender,
  }: {
    collateralToken: AgreementERC1155Mock;
    loanFactory: RoyaltyLoanFactory;
    paymentToken: ERC20TokenMock;
    lender: SignerWithAddress;
  }) =>
  async (
    borrower: SignerWithAddress,
    overrides?: {
      collateralAmount?: BigNumberish;
      loanAmount?: BigNumberish;
      feePpm?: BigNumberish;
      noApprove?: boolean;
    },
  ): Promise<RoyaltyLoan> => {
    if (!overrides?.noApprove) {
      await (
        await collateralToken
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), true)
      ).wait();
    }

    const receipt = await (
      await loanFactory
        .connect(borrower)
        .createLoanContract(
          await collateralToken.getAddress(),
          defaults.collateralTokenId,
          overrides?.collateralAmount || defaults.collateralAmount,
          overrides?.loanAmount || defaults.loanAmount,
          overrides?.feePpm || defaults.feePpm,
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

const getCurrentBalancesCreator =
  ({
    collateralToken,
    paymentToken,
  }: {
    collateralToken: AgreementERC1155Mock;
    paymentToken: ERC20TokenMock;
  }) =>
  async (
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
  const [deployer, borrower, lender] = await hre.ethers.getSigners();

  const whitelist = await new Whitelist__factory(deployer).deploy(
    deployer.address,
  );
  await (await whitelist.addToWhitelist(deployer)).wait();

  const paymentToken = await deployProxy(
    new ERC20TokenMock__factory(deployer),
    ['USDC', 'USDC', 6],
  );

  const collateralToken = await deployProxy(
    new AgreementERC1155Mock__factory(deployer),
    ['www.siemanko.info'],
  );

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

  return {
    signers: [deployer, borrower, lender],
    defaults,
    whitelist,
    loanTemplate,
    loanFactory,
    collateralToken,
    paymentToken,
    getCurrentBalances: getCurrentBalancesCreator({
      collateralToken,
      paymentToken,
    }),
    createLoanWithFactory: createLoanWithFactoryCreator({
      collateralToken,
      loanFactory,
      paymentToken,
      lender,
    }),
    deployLoan: deployLoanCreator({ collateralToken, paymentToken }),
  };
};
