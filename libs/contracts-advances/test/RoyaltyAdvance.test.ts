import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import {
  AgreementERC1155,
  ERC20TokenMock,
  RoyaltyAdvance__factory,
  RoyaltyAdvanceFactory,
} from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture, AdvanceState, RoyaltyAdvanceError } from './fixture';
import { ZeroAddress } from 'ethers';

let expect: Chai.ExpectStatic;

const advanceIFace = {
  interface: RoyaltyAdvance__factory.createInterface(),
};

describe('RoyaltyAdvance', () => {
  let deployer: SignerWithAddress;
  let recipient: SignerWithAddress;
  let advancer: SignerWithAddress;
  let collateralRecipient: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let collateralTokenA: AgreementERC1155;
  let collateralTokenB: AgreementERC1155;
  let advanceFactory: RoyaltyAdvanceFactory;

  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];

  let getCurrentBalances: Awaited<
    ReturnType<typeof fixture>
  >['getCurrentBalances'];

  let createAdvance: Awaited<ReturnType<typeof fixture>>['createAdvance'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, advancer, recipient, collateralRecipient] = deployment.signers;
    ({
      paymentToken,
      advanceFactory,
      getCurrentBalances,
      createAdvance,
      defaults,
    } = deployment);
    await (
      await paymentToken.mintTo(advancer.address, defaults.advanceAmount)
    ).wait();

    collateralTokenA = (
      await deployment.deployAgreementERC1155([
        {
          account: recipient.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ])
    ).connect(deployer);

    collateralTokenB = (
      await deployment.deployAgreementERC1155([
        {
          account: recipient.address,
          balance: defaults.collateralAmount * 3n,
          isAdmin: true,
        },
      ])
    ).connect(deployer);
  });

  describe('initialize', () => {
    // Not tested due to factory restrictions:
    // 'RoyaltyAdvance: Invalid payment token address'
    // 'RoyaltyAdvance: Collateral was not transferred in the required amount at position '
    // 'RoyaltyAdvance: Duration must be greater than 0'
    it('reverts with invalid args', async () => {
      await (
        await collateralTokenA
          .connect(recipient)
          .setApprovalForAll(await advanceFactory.getAddress(), true)
      ).wait();

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: ethers.ZeroAddress,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          defaults.advanceAmount,
          defaults.feePpm,
        ),
      ).to.be.reverted;
      // Without factory it should do:
      // 'RoyaltyAdvance: Invalid collateral token address at position 0',

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: 0n,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          defaults.advanceAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.ZeroCollateralAmount,
      );

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          ZeroAddress,
          defaults.advanceAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.ZeroCollateralReceiverAddress,
      );

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          0n,
          defaults.feePpm,
        ),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.ZeroAdvanceAmount,
      );

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          defaults.advanceAmount,
          1000001n,
        ),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.FeePpmTooHigh,
      );

      await (
        await collateralTokenA
          .connect(recipient)
          .setApprovalForAll(await advanceFactory.getAddress(), false)
      ).wait();

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          defaults.advanceAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWithCustomError(
        collateralTokenA,
        'ERC1155MissingApprovalForAll',
      );

      await (
        await collateralTokenA
          .connect(recipient)
          .setApprovalForAll(await advanceFactory.getAddress(), true)
      ).wait();

      await expect(
        advanceFactory.connect(recipient).createAdvanceContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          recipient.address,
          defaults.advanceAmount,
          defaults.feePpm,
        ),
      ).not.to.be.reverted;
    });

    it('reverts with no collaterals provided', async () => {
      await expect(
        advanceFactory
          .connect(recipient)
          .createAdvanceContract(
            [],
            recipient.address,
            defaults.advanceAmount,
            defaults.feePpm,
          ),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.NoCollateralsProvided,
      );
    });

    it('works with multiple collaterals', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB },
      ]);

      const blockNumber = await advance.runner?.provider?.getBlockNumber();

      if (!blockNumber) {
        throw new Error('Block number not found for deployment');
      }

      const advanceCreatedEvent = await advanceFactory.queryFilter(
        advanceFactory.getEvent('AdvanceContractCreated'),
        blockNumber - 1,
        blockNumber - 1,
      );

      expect(advanceCreatedEvent[0].args.collaterals[0].tokenAddress).to.equal(
        await collateralTokenA.getAddress(),
      );
      expect(advanceCreatedEvent[0].args.collaterals[1].tokenAddress).to.equal(
        await collateralTokenB.getAddress(),
      );
    });
  });

  describe('provide advance', () => {
    it('successfully provides a advance', async () => {
      const [recipientBalancesBefore, advancerBalancesBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          advancer.address,
        ]);
      expect(recipientBalancesBefore.ERC1155).to.equal(
        defaults.collateralAmount,
      );
      expect(recipientBalancesBefore.ERC20).to.equal(0n);
      expect(advancerBalancesBefore.ERC20).to.equal(defaults.advanceAmount);

      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.connect(advancer).provideAdvance()).not.to.be
        .reverted;

      expect(await advance.advanceState()).to.equal(AdvanceState.Active);

      const [
        recipientBalancesAfter,
        advancerBalancesAfter,
        advanceBalancesAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfter.ERC1155).to.equal(0n);
      expect(recipientBalancesAfter.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesAfter.ERC20).to.equal(0n);
      expect(advanceBalancesAfter.ERC1155).to.equal(defaults.collateralAmount);
    });

    it('successfully provides a advance then throws as cannot provide advance twice', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(advance.connect(advancer).provideAdvance()).not.to.be
        .reverted;
      await expect(
        advance.connect(advancer).provideAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceAlreadyActive,
      );
    });

    it('throws as advance is not active', async () => {
      const [advancerBalanceBefore] = await getCurrentBalances(
        collateralTokenA,
        [advancer.address],
      );
      expect(advancerBalanceBefore.ERC20).to.equal(defaults.advanceAmount);

      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;
      await expect(
        advance.connect(advancer).provideAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceOfferRevoked,
      );

      const [advancerBalanceAfter] = await getCurrentBalances(
        collateralTokenA,
        [advancer.address],
      );
      expect(advancerBalanceAfter.ERC20).to.equal(defaults.advanceAmount);
    });

    it('throws as advance is expired', async () => {
      const [advancerBalanceBefore] = await getCurrentBalances(
        collateralTokenA,
        [advancer.address],
      );
      expect(advancerBalanceBefore.ERC20).to.equal(defaults.advanceAmount);

      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await time.increase(defaults.duration + 1n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(
        advance.connect(advancer).provideAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceOfferExpired,
      );

      const [advancerBalanceAfter] = await getCurrentBalances(
        collateralTokenA,
        [advancer.address],
      );
      expect(advancerBalanceAfter.ERC20).to.equal(defaults.advanceAmount);
    });
  });

  describe('processRepayment', () => {
    it('successfully makes full repayment', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();

      const [
        recipientBalancesBefore,
        advancerBalancesBefore,
        advanceBalancesBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesBefore.ERC1155).to.equal(0n);
      expect(recipientBalancesBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesBefore.ERC1155).to.equal(0n);
      expect(advancerBalancesBefore.ERC20).to.equal(0n);
      expect(advanceBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceBalancesBefore.ERC20).to.equal(0n);

      // repay advance
      const totalDue = defaults.feeAmount + defaults.advanceAmount;

      await (
        await paymentToken.mintTo(recipient.address, defaults.feeAmount)
      ).wait();
      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), totalDue)
      ).wait();

      // processes repayment
      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfter,
        advancerBalancesAfter,
        advanceBalancesAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfter.ERC1155).to.equal(
        defaults.collateralAmount,
      );
      expect(recipientBalancesAfter.ERC20).to.equal(0n);
      expect(advancerBalancesAfter.ERC1155).to.equal(0n);
      expect(advancerBalancesAfter.ERC20).to.equal(totalDue);
      expect(advanceBalancesAfter.ERC1155).to.equal(0n);
      expect(advanceBalancesAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('successfully makes full repayment with exceeded balance', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();

      const [
        recipientBalancesBefore,
        advancerBalancesBefore,
        advanceBalancesBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesBefore.ERC1155).to.equal(0n);
      expect(recipientBalancesBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesBefore.ERC1155).to.equal(0n);
      expect(advancerBalancesBefore.ERC20).to.equal(0n);
      expect(advanceBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceBalancesBefore.ERC20).to.equal(0n);

      // repay advance
      const totalDue = defaults.feeAmount + defaults.advanceAmount;
      const excessBalance = defaults.advanceAmount;

      await (
        await paymentToken.mintTo(
          recipient.address,
          defaults.feeAmount + excessBalance,
        )
      ).wait();
      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), totalDue + excessBalance)
      ).wait();

      // processes repayment
      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfter,
        advancerBalancesAfter,
        advanceBalancesAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfter.ERC1155).to.equal(
        defaults.collateralAmount,
      );
      expect(recipientBalancesAfter.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesAfter.ERC1155).to.equal(0n);
      expect(advancerBalancesAfter.ERC20).to.equal(totalDue);
      expect(advanceBalancesAfter.ERC1155).to.equal(0n);
      expect(advanceBalancesAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('successfully makes full repayment with exceeded balance with alternative collateralReceiver', async () => {
      const advance = await createAdvance.standard(
        recipient,
        [{ collateralToken: collateralTokenA }],
        { collateralReceiver: collateralRecipient.address },
      );
      await (await advance.connect(advancer).provideAdvance()).wait();

      const [
        recipientBalancesBefore,
        advancerBalancesBefore,
        advanceBalancesBefore,
        receiverBalancesBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        collateralRecipient.address,
      ]);

      expect(recipientBalancesBefore.ERC1155).to.equal(0n);
      expect(recipientBalancesBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesBefore.ERC1155).to.equal(0n);
      expect(advancerBalancesBefore.ERC20).to.equal(0n);
      expect(advanceBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceBalancesBefore.ERC20).to.equal(0n);
      expect(receiverBalancesBefore.ERC1155).to.equal(0n);
      expect(receiverBalancesBefore.ERC20).to.equal(0n);

      // repay advance
      const totalDue = defaults.feeAmount + defaults.advanceAmount;
      const excessBalance = defaults.advanceAmount;

      await (
        await paymentToken.mintTo(
          recipient.address,
          defaults.feeAmount + excessBalance,
        )
      ).wait();
      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), totalDue + excessBalance)
      ).wait();

      // processes repayment
      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfter,
        advancerBalancesAfter,
        advanceBalancesAfter,
        receiverBalancesAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        collateralRecipient.address,
      ]);

      expect(recipientBalancesAfter.ERC1155).to.equal(0n);
      expect(recipientBalancesAfter.ERC20).to.equal(0n);
      expect(advancerBalancesAfter.ERC1155).to.equal(0n);
      expect(advancerBalancesAfter.ERC20).to.equal(totalDue);
      expect(advanceBalancesAfter.ERC1155).to.equal(0n);
      expect(advanceBalancesAfter.ERC20).to.equal(0n);
      expect(receiverBalancesAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(receiverBalancesAfter.ERC20).to.equal(excessBalance);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('successfully makes partial repayments', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();

      const [
        recipientBalancesBefore,
        advancerBalancesBefore,
        advanceBalancesBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesBefore.ERC1155).to.equal(0n);
      expect(recipientBalancesBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerBalancesBefore.ERC1155).to.equal(0n);
      expect(advancerBalancesBefore.ERC20).to.equal(0n);
      expect(advanceBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceBalancesBefore.ERC20).to.equal(0n);

      const totalDue = defaults.feeAmount + defaults.advanceAmount;

      const firstInstallment = ethers.parseUnits('5', 6);
      const secondInstallment = ethers.parseUnits('4', 6);
      const thirdInstallment = totalDue - firstInstallment - secondInstallment;

      await (
        await paymentToken.mintTo(recipient.address, defaults.feeAmount)
      ).wait();

      // First round
      expect(await advance.connect(advancer).totalDue()).to.equal(totalDue);
      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), firstInstallment)
      ).wait();

      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfterFirst,
        advancerBalancesAfterFirst,
        advanceBalancesAfterFirst,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfterFirst.ERC20).to.equal(
        totalDue - firstInstallment,
      );
      expect(advancerBalancesAfterFirst.ERC20).to.equal(firstInstallment);
      expect(advanceBalancesAfterFirst.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Active);

      // Second round
      expect(await advance.connect(advancer).totalDue()).to.equal(
        totalDue - firstInstallment,
      );

      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), secondInstallment)
      ).wait();

      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfterSecond,
        advancerBalancesAfterSecond,
        advanceBalancesAfterSecond,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfterSecond.ERC20).to.equal(
        totalDue - firstInstallment - secondInstallment,
      );
      expect(advancerBalancesAfterSecond.ERC20).to.equal(
        firstInstallment + secondInstallment,
      );
      expect(advanceBalancesAfterSecond.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Active);

      // Final round
      expect(await advance.connect(advancer).totalDue()).to.equal(
        totalDue - firstInstallment - secondInstallment,
      );
      await (
        await paymentToken
          .connect(recipient)
          .transfer(await advance.getAddress(), thirdInstallment)
      ).wait();

      await expect(advance.connect(recipient).processRepayment()).not.to.be
        .reverted;

      const [
        recipientBalancesAfterFinal,
        advancerBalancesAfterFinal,
        advanceBalancesAfterFinal,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
      ]);

      expect(recipientBalancesAfterFinal.ERC20).to.equal(0n);
      expect(advancerBalancesAfterFinal.ERC20).to.equal(totalDue);
      expect(advanceBalancesAfterFinal.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('triggers claimHolderFunds on AgreementsERC1155', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB }, // By default recipient has 3000 shares but 1000 were collateralized
      ]);

      await (await advance.connect(advancer).provideAdvance()).wait();

      await (
        await paymentToken.mintTo(
          await collateralTokenA.getAddress(),
          ethers.parseUnits('10', 6),
        )
      ).wait();
      await (
        await paymentToken.mintTo(
          await collateralTokenB.getAddress(),
          ethers.parseUnits('30', 6),
        )
      ).wait();

      const [
        recipientTokensABefore,
        advancerTokensABefore,
        advanceTokensABefore,
        agreementABefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        await collateralTokenA.getAddress(),
      ]);
      const [
        recipientTokensBBefore,
        advancerTokensBBefore,
        advanceTokensBBefore,
        agreementBBefore,
      ] = await getCurrentBalances(collateralTokenB, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        await collateralTokenB.getAddress(),
      ]);

      // ERC1155
      expect(recipientTokensABefore.ERC1155).to.equal(0n);
      expect(advanceTokensABefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(recipientTokensBBefore.ERC1155).to.equal(2000n); // because only 1k were collateralized
      expect(advanceTokensBBefore.ERC1155).to.equal(defaults.collateralAmount);

      // ERC20
      expect(recipientTokensABefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advancerTokensABefore.ERC20).to.equal(0n);
      expect(advanceTokensABefore.ERC20).to.equal(0n);
      expect(agreementABefore.ERC20).to.equal(ethers.parseUnits('10', 6));
      expect(agreementBBefore.ERC20).to.equal(ethers.parseUnits('30', 6));

      const receipt = await (
        await advance.connect(recipient).processRepayment()
      ).wait();

      const collateralAEvents = await collateralTokenA.queryFilter(
        collateralTokenA.filters.HolderFundsClaimed,
        receipt?.blockNumber,
        receipt?.blockNumber,
      );

      const collateralBEvents = await collateralTokenB.queryFilter(
        collateralTokenB.filters.HolderFundsClaimed,
        receipt?.blockNumber,
        receipt?.blockNumber,
      );

      expect(collateralAEvents.length).to.equal(1);
      expect(collateralBEvents.length).to.equal(2); // 1/3 for advance, 2/3 for holder

      expect(collateralBEvents[0].args.account).to.equal(
        await advance.getAddress(),
      );
      expect(collateralBEvents[0].args.value).to.equal(
        ethers.parseUnits('10', 6).toString(),
      );

      expect(collateralBEvents[1].args.account).to.equal(
        await recipient.getAddress(),
      );
      expect(collateralBEvents[1].args.value).to.equal(
        ethers.parseUnits('20', 6).toString(),
      );

      const [
        recipientTokensAAfter,
        advancerTokensAAfter,
        advanceTokensAAfter,
        agreementAAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        await collateralTokenA.getAddress(),
      ]);
      const [
        recipientTokensBAfter,
        advancerTokensBAfter,
        advanceTokensBAfter,
        agreementBAfter,
      ] = await getCurrentBalances(collateralTokenB, [
        recipient.address,
        advancer.address,
        await advance.getAddress(),
        await collateralTokenB.getAddress(),
      ]);

      // ERC1155
      expect(recipientTokensAAfter.ERC1155).to.equal(1000n);
      expect(advanceTokensAAfter.ERC1155).to.equal(0n);
      expect(recipientTokensBAfter.ERC1155).to.equal(3000n);
      expect(advanceTokensBAfter.ERC1155).to.equal(0n);

      // ERC20
      expect(recipientTokensAAfter.ERC20).to.equal(
        ethers.parseUnits('10', 6) +
          ethers.parseUnits('30', 6) -
          defaults.feeAmount,
      );
      expect(advancerTokensAAfter.ERC20).to.equal(
        defaults.advanceAmount + defaults.feeAmount,
      );
      expect(advanceTokensAAfter.ERC20).to.equal(0n);
      expect(agreementAAfter.ERC20).to.equal(0n);
      expect(agreementBAfter.ERC20).to.equal(0n);
    });

    it('throws as advance is not provided', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(
        advance.connect(recipient).processRepayment(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceNotActive,
      );
    });

    it('throws as no USDC to process', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();

      await expect(
        advance.connect(recipient).processRepayment(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.NoPaymentTokenToProcess,
      );
    });
  });

  describe('revokeAdvance', () => {
    it('successfully revokes a advance with single collateral', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      const excessBalance = ethers.parseUnits('1', 6);

      await (
        await paymentToken.mintTo(await advance.getAddress(), excessBalance)
      ).wait();

      const [recipientTokensBefore, advanceTokensBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(recipientTokensBefore.ERC1155).to.equal(0n);
      expect(recipientTokensBefore.ERC20).to.equal(0n);
      expect(advanceTokensBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceTokensBefore.ERC20).to.equal(excessBalance);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;

      expect(await advance.advanceState()).to.equal(AdvanceState.Revoked);

      const [recipientTokensAfter, advanceTokensAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(recipientTokensAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(recipientTokensAfter.ERC20).to.equal(excessBalance);
      expect(advanceTokensAfter.ERC1155).to.equal(0n);
      expect(advanceTokensAfter.ERC20).to.equal(0n);
    });

    it('successfully revokes a advance with multiple collaterals', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB },
      ]);

      const [recipientTokensABefore, advanceTokensABefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      const [recipientTokensBBefore, advanceTokensBBefore] =
        await getCurrentBalances(collateralTokenB, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;

      expect(await advance.advanceState()).to.equal(AdvanceState.Revoked);

      const [recipientTokensAAfter, advanceTokensAAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      const [recipientTokensBAfter, advanceTokensBAfter] =
        await getCurrentBalances(collateralTokenB, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(recipientTokensAAfter.ERC1155).to.equal(
        recipientTokensABefore.ERC1155 + advanceTokensABefore.ERC1155,
      );

      expect(advanceTokensAAfter.ERC1155).to.equal(0n);

      expect(recipientTokensBAfter.ERC1155).to.equal(
        recipientTokensBBefore.ERC1155 + advanceTokensBBefore.ERC1155,
      );

      expect(advanceTokensBAfter.ERC1155).to.equal(0n);
    });

    it('revoked advance returns tokens to the recipient, not to the alt collateralReceiver', async () => {
      const advance = await createAdvance.standard(
        recipient,
        [{ collateralToken: collateralTokenA }],
        {
          collateralReceiver: collateralRecipient.address,
        },
      );

      const excessBalance = ethers.parseUnits('1', 6);

      await (
        await paymentToken.mintTo(await advance.getAddress(), excessBalance)
      ).wait();

      const [recipientTokensBefore, advanceTokensBefore, receiverTokensBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
          collateralRecipient.address,
        ]);

      expect(recipientTokensBefore.ERC1155).to.equal(0n);
      expect(recipientTokensBefore.ERC20).to.equal(0n);
      expect(advanceTokensBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceTokensBefore.ERC20).to.equal(excessBalance);
      expect(receiverTokensBefore.ERC1155).to.equal(0n);
      expect(receiverTokensBefore.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;

      expect(await advance.advanceState()).to.equal(AdvanceState.Revoked);

      const [recipientTokensAfter, advanceTokensAfter, receiverTokensAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
          collateralRecipient.address,
        ]);

      expect(recipientTokensAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(recipientTokensAfter.ERC20).to.equal(excessBalance);
      expect(advanceTokensAfter.ERC1155).to.equal(0n);
      expect(advanceTokensAfter.ERC20).to.equal(0n);
      expect(receiverTokensAfter.ERC1155).to.equal(0n);
      expect(receiverTokensAfter.ERC20).to.equal(0n);
    });

    it('successfully revokes expired advance', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      const excessBalance = ethers.parseUnits('1', 6);

      await (
        await paymentToken.mintTo(await advance.getAddress(), excessBalance)
      ).wait();

      const [recipientTokensBefore, advanceTokensBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(recipientTokensBefore.ERC1155).to.equal(0n);
      expect(recipientTokensBefore.ERC20).to.equal(0n);
      expect(advanceTokensBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(advanceTokensBefore.ERC20).to.equal(excessBalance);

      await time.increase(defaults.duration + 1n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(
        advance.connect(advancer).provideAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceOfferExpired,
      );

      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;

      const [recipientTokensAfter, advanceTokensAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);

      expect(recipientTokensAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(recipientTokensAfter.ERC20).to.equal(excessBalance);
      expect(advanceTokensAfter.ERC1155).to.equal(0n);
      expect(advanceTokensAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Revoked);
    });

    it('throws as msg sender is not recipient', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(
        advance.connect(advancer).revokeAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.OnlyRecipientAllowed,
      );
    });

    it('throws as cannot revoke twice', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(advance.connect(recipient).revokeAdvance()).not.to.be
        .reverted;
      await expect(
        advance.connect(recipient).revokeAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceOfferRevoked,
      );
    });

    it('throws as advance is provided', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();
      await expect(
        advance.connect(recipient).revokeAdvance(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceAlreadyActive,
      );
    });
  });

  describe('reclaimExcessPaymentToken', () => {
    it('reclaims excess tokens before advance is active', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount,
        )
      ).wait();
      const [recipientBalanceBefore, advanceBalanceBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);
      expect(recipientBalanceBefore.ERC20).to.equal(0n);
      expect(advanceBalanceBefore.ERC20).to.equal(defaults.advanceAmount);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [recipientBalanceAfter, advanceBalanceAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);
      expect(recipientBalanceAfter.ERC20).to.equal(defaults.advanceAmount);
      expect(advanceBalanceAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);
    });

    it('reclaims excess tokens before advance is active with alt collateralReceiver not getting anything', async () => {
      const advance = await createAdvance.standard(
        recipient,
        [{ collateralToken: collateralTokenA }],
        { collateralReceiver: collateralRecipient.address },
      );

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount,
        )
      ).wait();

      const [
        recipientBalanceBefore,
        advanceBalanceBefore,
        receiverBalanceBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        await advance.getAddress(),
        collateralRecipient.address,
      ]);

      expect(recipientBalanceBefore.ERC20).to.equal(0n);
      expect(advanceBalanceBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(receiverBalanceBefore.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(advance.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [recipientBalanceAfter, advanceBalanceAfter, receiverBalanceAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
          collateralRecipient.address,
        ]);
      expect(recipientBalanceAfter.ERC20).to.equal(defaults.advanceAmount);
      expect(advanceBalanceAfter.ERC20).to.equal(0n);
      expect(receiverBalanceAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);
    });

    it('reclaims excess tokens after advance is repaid', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();
      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount + defaults.feeAmount,
        )
      ).wait();

      await (await advance.processRepayment()).wait();

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);

      const [recipientBalanceBefore, advanceBalanceBefore] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);
      expect(recipientBalanceBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advanceBalanceBefore.ERC20).to.equal(0n);

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount,
        )
      ).wait();

      await expect(advance.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [recipientBalanceAfter, advanceBalanceAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
        ]);
      expect(recipientBalanceAfter.ERC20).to.equal(defaults.advanceAmount * 2n);
      expect(advanceBalanceAfter.ERC20).to.equal(0n);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('reclaims excess tokens after advance is repaid with alt collateralReceiver getting everything', async () => {
      const advance = await createAdvance.standard(
        recipient,
        [{ collateralToken: collateralTokenA }],
        { collateralReceiver: collateralRecipient.address },
      );

      await (await advance.connect(advancer).provideAdvance()).wait();

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount + defaults.feeAmount,
        )
      ).wait();

      await (await advance.processRepayment()).wait();

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);

      const [
        recipientBalanceBefore,
        advanceBalanceBefore,
        receiverBalanceBefore,
      ] = await getCurrentBalances(collateralTokenA, [
        recipient.address,
        await advance.getAddress(),
        collateralRecipient.address,
      ]);
      expect(recipientBalanceBefore.ERC20).to.equal(defaults.advanceAmount);
      expect(advanceBalanceBefore.ERC20).to.equal(0n);
      expect(receiverBalanceBefore.ERC20).to.equal(0n);

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount,
        )
      ).wait();

      await expect(advance.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [recipientBalanceAfter, advanceBalanceAfter, receiverBalanceAfter] =
        await getCurrentBalances(collateralTokenA, [
          recipient.address,
          await advance.getAddress(),
          collateralRecipient.address,
        ]);
      expect(recipientBalanceAfter.ERC20).to.equal(defaults.advanceAmount);
      expect(advanceBalanceAfter.ERC20).to.equal(0n);
      expect(receiverBalanceAfter.ERC20).to.equal(defaults.advanceAmount);

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);
    });

    it('throws when advance is active', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);
      await (await advance.connect(advancer).provideAdvance()).wait();

      expect(await advance.advanceState()).to.equal(AdvanceState.Active);

      await expect(
        advance.reclaimExcessPaymentToken(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.AdvanceAlreadyActive,
      );
    });

    it('throws when advance balance is 0', async () => {
      const advance = await createAdvance.standard(recipient, [
        { collateralToken: collateralTokenA },
      ]);

      expect(await advance.advanceState()).to.equal(AdvanceState.Pending);

      await expect(
        advance.reclaimExcessPaymentToken(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.NoPaymentTokenToProcess,
      );

      await (await advance.connect(advancer).provideAdvance()).wait();

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount + defaults.feeAmount,
        )
      ).wait();

      await (await advance.connect(recipient).processRepayment()).wait();

      expect(await advance.advanceState()).to.equal(AdvanceState.Repaid);

      await expect(
        advance.reclaimExcessPaymentToken(),
      ).to.be.revertedWithCustomError(
        advanceIFace,
        RoyaltyAdvanceError.NoPaymentTokenToProcess,
      );
    });
  });
});
