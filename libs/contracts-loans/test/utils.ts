import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumberish, ethers, HDNodeWallet, Wallet } from 'ethers';
import {
  RoyaltyAdvanceFactory,
  ERC20TokenMock,
  AgreementERC1155,
  RoyaltyAdvance,
  RoyaltyAdvance__factory,
  AgreementFactory__factory,
  AgreementERC1155__factory,
} from '../typechain';
import { ICollateral } from '../typechain/contracts/Advances/RoyaltyAdvance';
import { defaults, HolderStruct } from './fixture';
import { getEvent } from '@royalty-loans/contracts-agreements';

export const createAdvanceCreator = (args: {
  advanceFactory: RoyaltyAdvanceFactory;
  paymentToken: ERC20TokenMock;
  advancer: SignerWithAddress;
}) => ({
  standard: createStandardAdvanceCreator(args),
});

const createStandardAdvanceCreator =
  ({
    advanceFactory,
    paymentToken,
    advancer,
  }: {
    advanceFactory: RoyaltyAdvanceFactory;
    paymentToken: ERC20TokenMock;
    advancer: SignerWithAddress;
  }) =>
  async (
    recipient: SignerWithAddress,
    collateralsWithOpts: {
      collateralToken: AgreementERC1155;
      collateralAmount?: BigNumberish;
    }[],
    overrides?: {
      advanceAmount?: BigNumberish;
      feePpm?: BigNumberish;
      collateralReceiver?: string;
    },
  ): Promise<RoyaltyAdvance> => {
    const collaterals: ICollateral.CollateralStruct[] = [];

    for (const coll of collateralsWithOpts) {
      await (
        await coll.collateralToken
          .connect(recipient)
          .setApprovalForAll(await advanceFactory.getAddress(), true)
      ).wait();

      collaterals.push({
        tokenAddress: await coll.collateralToken.getAddress(),
        tokenAmount: coll.collateralAmount ?? defaults.collateralAmount,
        tokenId: defaults.collateralTokenId,
      });
    }

    const collateralReceiver =
      overrides?.collateralReceiver !== undefined
        ? overrides?.collateralReceiver
        : recipient.address;

    const receipt = await (
      await advanceFactory
        .connect(recipient)
        .createAdvanceContract(
          collaterals,
          collateralReceiver,
          overrides?.advanceAmount ?? defaults.advanceAmount,
          overrides?.feePpm ?? defaults.feePpm,
        )
    ).wait();

    const advanceContractAddress = (
      await advanceFactory.queryFilter(
        advanceFactory.getEvent('AdvanceContractCreated'),
        receipt?.blockNumber,
        receipt?.blockNumber,
      )
    )[0].args.advanceContract;

    const royaltyAdvance = RoyaltyAdvance__factory.connect(
      advanceContractAddress,
      recipient,
    );

    await (
      await paymentToken
        .connect(advancer)
        .approve(advanceContractAddress, ethers.MaxUint256)
    ).wait();

    return royaltyAdvance;
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
