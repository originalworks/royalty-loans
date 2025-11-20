import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import {
  AgreementERC1155,
  ERC20TokenMock,
  RoyaltyLoanFactory,
  TestRoyaltyLoanFactory,
} from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from './fixture';

let expect: Chai.ExpectStatic;

describe('RoyaltyLoanFactory', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let collateralTokenA: AgreementERC1155;
  let collateralTokenB: AgreementERC1155;
  let loanFactory: RoyaltyLoanFactory;
  let fakeLoanFactory: TestRoyaltyLoanFactory;

  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];

  let getCurrentBalances: Awaited<
    ReturnType<typeof fixture>
  >['getCurrentBalances'];

  let createLoanWithFactory: Awaited<
    ReturnType<typeof fixture>
  >['createLoanWithFactory'];

  let deployLoan: Awaited<ReturnType<typeof fixture>>['deployLoan'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, borrower, lender] = deployment.signers;
    ({
      paymentToken,
      loanFactory,
      collaterals: { collateralTokenA, collateralTokenB },
      fakeLoanFactory,
      getCurrentBalances,
      createLoanWithFactory,
      defaults,
    } = deployment);
    await (
      await paymentToken.mintTo(lender.address, defaults.loanAmount)
    ).wait();
  });

  describe('initialize', () => {
    it('reverts with invalid args', async () => {
      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await fakeLoanFactory.getAddress(), true)
      ).wait();

      await expect(
        fakeLoanFactory.connect(borrower).createLoanContract(
          [
            {
              tokenAddress: ethers.ZeroAddress,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.reverted;
      // Without factory it should do:
      // 'RoyaltyLoan: Invalid collateral token address at position 0',

      await expect(
        fakeLoanFactory.connect(borrower).createLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: 0n,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'RoyaltyLoan: Collateral amount must be greater than 0 at position 0',
      );

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
          true, // omit transfer in factory
        ),
      ).to.be.revertedWith(
        'RoyaltyLoan: Collateral was not transferred in the required amount at position 0',
      );

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          0n,
          defaults.feePpm,
          false, // omit transfer in factory
        ),
      ).to.be.revertedWith('RoyaltyLoan: Loan amount must be greater than 0');

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          1000001n,
          false, // omit transfer in factory
        ),
      ).to.be.revertedWith('RoyaltyLoan: FeePpm exceeds 100%');

      await (
        await fakeLoanFactory.setPaymentTokenAddress(ethers.ZeroAddress)
      ).wait();

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
          false, // omit transfer in factory
        ),
      ).to.be.revertedWith('RoyaltyLoan: Invalid payment token address');

      await (
        await fakeLoanFactory.setPaymentTokenAddress(
          await paymentToken.getAddress(),
        )
      ).wait();

      await (await fakeLoanFactory.setOfferDuration(0n)).wait();

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
          false, // omit transfer in factory
        ),
      ).to.be.revertedWith('RoyaltyLoan: Duration must be greater than 0');

      await (await fakeLoanFactory.setOfferDuration(defaults.duration)).wait();

      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await fakeLoanFactory.getAddress(), false)
      ).wait();

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
          false, // omit transfer in factory
        ),
      ).to.be.revertedWithCustomError(
        collateralTokenA,
        'ERC1155MissingApprovalForAll',
      );

      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await fakeLoanFactory.getAddress(), true)
      ).wait();

      await expect(
        fakeLoanFactory.connect(borrower).testCreateLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
          false, // omit transfer in factory
        ),
      ).not.to.be.reverted;
    });

    it('works with multiple collaterals', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB },
      ]);

      const blockNumber = await loan.runner?.provider?.getBlockNumber();

      if (!blockNumber) {
        throw new Error('Block number not found for deployment');
      }

      const loanCreatedEvent = await loanFactory.queryFilter(
        loanFactory.getEvent('LoanContractCreated'),
        blockNumber - 1,
        blockNumber - 1,
      );

      expect(loanCreatedEvent[0].args.collaterals[0].tokenAddress).to.equal(
        await collateralTokenA.getAddress(),
      );
      expect(loanCreatedEvent[0].args.collaterals[1].tokenAddress).to.equal(
        await collateralTokenB.getAddress(),
      );
    });
  });

  describe('provide loan', () => {
    it('successfully provides a loan', async () => {
      const [borrowerBalancesBefore, lenderBalancesBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
        ]);
      expect(borrowerBalancesBefore.ERC1155).to.equal(
        defaults.collateralAmount,
      );
      expect(borrowerBalancesBefore.ERC20).to.equal(0n);
      expect(lenderBalancesBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;

      const [borrowerBalancesAfter, lenderBalancesAfter, loanBalancesAfter] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesAfter.ERC1155).to.equal(0n);
      expect(borrowerBalancesAfter.ERC20).to.equal(defaults.loanAmount);
      expect(lenderBalancesAfter.ERC20).to.equal(0n);
      expect(loanBalancesAfter.ERC1155).to.equal(defaults.collateralAmount);

      expect(await loan.loanOfferActive()).to.equal(false);
      expect(await loan.loanActive()).to.equal(true);
    });

    it('successfully provides a loan then throws as cannot provide loan twice', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan is already active',
      );
    });

    it('throws as loan is not active', async () => {
      const [lenderBalanceBefore] = await getCurrentBalances(collateralTokenA, [
        lender.address,
      ]);
      expect(lenderBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer is revoked',
      );

      const [lenderBalanceAfter] = await getCurrentBalances(collateralTokenA, [
        lender.address,
      ]);
      expect(lenderBalanceAfter.ERC20).to.equal(defaults.loanAmount);
    });

    it('throws as loan is expired', async () => {
      const [lenderBalanceBefore] = await getCurrentBalances(collateralTokenA, [
        lender.address,
      ]);
      expect(lenderBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await time.increase(defaults.duration + 1n);

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer expired',
      );

      const [lenderBalanceAfter] = await getCurrentBalances(collateralTokenA, [
        lender.address,
      ]);
      expect(lenderBalanceAfter.ERC20).to.equal(defaults.loanAmount);
    });
  });

  describe.only('processRepayment', () => {
    it('successfully makes full repayment', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesBefore.ERC1155).to.equal(0n);
      expect(borrowerBalancesBefore.ERC20).to.equal(defaults.loanAmount);
      expect(lenderBalancesBefore.ERC1155).to.equal(0n);
      expect(lenderBalancesBefore.ERC20).to.equal(0n);
      expect(loanBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(loanBalancesBefore.ERC20).to.equal(0n);

      // repay loan
      const totalDue = defaults.feeAmount + defaults.loanAmount;

      await (
        await paymentToken.mintTo(borrower.address, defaults.feeAmount)
      ).wait();
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), totalDue)
      ).wait();

      // processes repayment
      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      const [borrowerBalancesAfter, lenderBalancesAfter, loanBalancesAfter] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(borrowerBalancesAfter.ERC20).to.equal(0n);
      expect(lenderBalancesAfter.ERC1155).to.equal(0n);
      expect(lenderBalancesAfter.ERC20).to.equal(totalDue);
      expect(loanBalancesAfter.ERC1155).to.equal(0n);
      expect(loanBalancesAfter.ERC20).to.equal(0n);

      expect(await loan.loanOfferActive()).to.equal(false);
      expect(await loan.loanActive()).to.equal(false);
    });

    it('successfully makes full repayment with exceeded balance', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesBefore.ERC1155).to.equal(0n);
      expect(borrowerBalancesBefore.ERC20).to.equal(defaults.loanAmount);
      expect(lenderBalancesBefore.ERC1155).to.equal(0n);
      expect(lenderBalancesBefore.ERC20).to.equal(0n);
      expect(loanBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(loanBalancesBefore.ERC20).to.equal(0n);

      // repay loan
      const totalDue = defaults.feeAmount + defaults.loanAmount;
      const excessBalance = defaults.loanAmount;

      await (
        await paymentToken.mintTo(
          borrower.address,
          defaults.feeAmount + excessBalance,
        )
      ).wait();
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), totalDue + excessBalance)
      ).wait();

      // processes repayment
      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      const [borrowerBalancesAfter, lenderBalancesAfter, loanBalancesAfter] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesAfter.ERC1155).to.equal(defaults.collateralAmount);
      expect(borrowerBalancesAfter.ERC20).to.equal(defaults.loanAmount);
      expect(lenderBalancesAfter.ERC1155).to.equal(0n);
      expect(lenderBalancesAfter.ERC20).to.equal(totalDue);
      expect(loanBalancesAfter.ERC1155).to.equal(0n);
      expect(loanBalancesAfter.ERC20).to.equal(0n);

      expect(await loan.loanOfferActive()).to.equal(false);
      expect(await loan.loanActive()).to.equal(false);
    });

    it('successfully makes partial repayments', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          lender.address,
          await loan.getAddress(),
        ]);

      expect(borrowerBalancesBefore.ERC1155).to.equal(0n);
      expect(borrowerBalancesBefore.ERC20).to.equal(defaults.loanAmount);
      expect(lenderBalancesBefore.ERC1155).to.equal(0n);
      expect(lenderBalancesBefore.ERC20).to.equal(0n);
      expect(loanBalancesBefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(loanBalancesBefore.ERC20).to.equal(0n);

      const totalDue = defaults.feeAmount + defaults.loanAmount;

      const firstInstallment = ethers.parseUnits('5', 6);
      const secondInstallment = ethers.parseUnits('4', 6);
      const thirdInstallment = totalDue - firstInstallment - secondInstallment;

      await (
        await paymentToken.mintTo(borrower.address, defaults.feeAmount)
      ).wait();

      // First round
      expect(await loan.connect(lender).getRemainingTotalDue()).to.equal(
        totalDue,
      );
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), firstInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      const [
        borrowerBalancesAfterFirst,
        lenderBalancesAfterFirst,
        loanBalancesAfterFirst,
      ] = await getCurrentBalances(collateralTokenA, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
      ]);

      expect(borrowerBalancesAfterFirst.ERC20).to.equal(
        totalDue - firstInstallment,
      );
      expect(lenderBalancesAfterFirst.ERC20).to.equal(firstInstallment);
      expect(loanBalancesAfterFirst.ERC20).to.equal(0n);

      expect(await loan.loanActive()).to.equal(true);

      // Second round
      expect(await loan.connect(lender).getRemainingTotalDue()).to.equal(
        totalDue - firstInstallment,
      );

      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), secondInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      const [
        borrowerBalancesAfterSecond,
        lenderBalancesAfterSecond,
        loanBalancesAfterSecond,
      ] = await getCurrentBalances(collateralTokenA, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
      ]);

      expect(borrowerBalancesAfterSecond.ERC20).to.equal(
        totalDue - firstInstallment - secondInstallment,
      );
      expect(lenderBalancesAfterSecond.ERC20).to.equal(
        firstInstallment + secondInstallment,
      );
      expect(loanBalancesAfterSecond.ERC20).to.equal(0n);

      expect(await loan.loanActive()).to.equal(true);

      // Final round
      expect(await loan.connect(lender).getRemainingTotalDue()).to.equal(
        totalDue - firstInstallment - secondInstallment,
      );
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), thirdInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      const [
        borrowerBalancesAfterFinal,
        lenderBalancesAfterFinal,
        loanBalancesAfterFinal,
      ] = await getCurrentBalances(collateralTokenA, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
      ]);

      expect(borrowerBalancesAfterFinal.ERC20).to.equal(0n);
      expect(lenderBalancesAfterFinal.ERC20).to.equal(totalDue);
      expect(loanBalancesAfterFinal.ERC20).to.equal(0n);

      expect(await loan.loanActive()).to.equal(false);
    });

    it.only('triggers claimHolderFunds on AgreementsERC1155', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB }, // By default borrower has 3000 shares but 1000 were collateralized
      ]);

      await (await loan.connect(lender).provideLoan()).wait();

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
        borrowerTokensABefore,
        lenderTokensABefore,
        loanTokensABefore,
        agreementABefore,
      ] = await getCurrentBalances(collateralTokenA, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
        await collateralTokenA.getAddress(),
      ]);
      const [
        borrowerTokensBBefore,
        lenderTokensBBefore,
        loanTokensBBefore,
        agreementBBefore,
      ] = await getCurrentBalances(collateralTokenB, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
        await collateralTokenB.getAddress(),
      ]);

      // ERC1155
      expect(borrowerTokensABefore.ERC1155).to.equal(0n);
      expect(loanTokensABefore.ERC1155).to.equal(defaults.collateralAmount);
      expect(borrowerTokensBBefore.ERC1155).to.equal(2000n); // because only 1k were collateralized
      expect(loanTokensBBefore.ERC1155).to.equal(defaults.collateralAmount);

      // ERC20
      expect(borrowerTokensABefore.ERC20).to.equal(defaults.loanAmount);
      expect(lenderTokensABefore.ERC20).to.equal(0n);
      expect(loanTokensABefore.ERC20).to.equal(0n);
      expect(agreementABefore.ERC20).to.equal(ethers.parseUnits('10', 6));
      expect(agreementBBefore.ERC20).to.equal(ethers.parseUnits('30', 6));

      const receipt = await (
        await loan.connect(borrower).processRepayment()
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
      expect(collateralBEvents.length).to.equal(2); // 1/3 for loan, 2/3 for holder

      expect(collateralBEvents[0].args.account).to.equal(
        await loan.getAddress(),
      );
      expect(collateralBEvents[0].args.value).to.equal(
        ethers.parseUnits('10', 6).toString(),
      );

      expect(collateralBEvents[1].args.account).to.equal(
        await borrower.getAddress(),
      );
      expect(collateralBEvents[1].args.value).to.equal(
        ethers.parseUnits('20', 6).toString(),
      );

      const [
        borrowerTokensAAfter,
        lenderTokensAAfter,
        loanTokensAAfter,
        agreementAAfter,
      ] = await getCurrentBalances(collateralTokenA, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
        await collateralTokenA.getAddress(),
      ]);
      const [
        borrowerTokensBAfter,
        lenderTokensBAfter,
        loanTokensBAfter,
        agreementBAfter,
      ] = await getCurrentBalances(collateralTokenB, [
        borrower.address,
        lender.address,
        await loan.getAddress(),
        await collateralTokenB.getAddress(),
      ]);

      // ERC1155
      expect(borrowerTokensAAfter.ERC1155).to.equal(1000n);
      expect(loanTokensAAfter.ERC1155).to.equal(0n);
      expect(borrowerTokensBAfter.ERC1155).to.equal(3000n);
      expect(loanTokensBAfter.ERC1155).to.equal(0n);

      // ERC20
      expect(borrowerTokensAAfter.ERC20).to.equal(
        ethers.parseUnits('10', 6) +
          ethers.parseUnits('30', 6) -
          defaults.feeAmount,
      );
      expect(lenderTokensAAfter.ERC20).to.equal(
        defaults.loanAmount + defaults.feeAmount,
      );
      expect(loanTokensAAfter.ERC20).to.equal(0n);
      expect(agreementAAfter.ERC20).to.equal(0n);
      expect(agreementBAfter.ERC20).to.equal(0n);
    });

    it('throws as loan is not provided', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('RoyaltyLoan: Loan is inactive');
    });

    it('throws as no USDC to process', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('RoyaltyLoan: No payment token to process');
    });
  });

  describe('revokeLoan', () => {
    it('successfully revokes a loan with single collateral', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      const [borrowerTokensBefore, loanTokensBefore] = await getCurrentBalances(
        collateralTokenA,
        [borrower.address, await loan.getAddress()],
      );

      const isLoanActive = await loan.loanOfferActive();
      expect(isLoanActive).to.equal(true);

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      const isLoanActiveAfterTx = await loan.loanOfferActive();
      expect(isLoanActiveAfterTx).to.equal(false);

      const [borrowerTokensAfter, loanTokensAfter] = await getCurrentBalances(
        collateralTokenA,
        [borrower.address, await loan.getAddress()],
      );

      expect(borrowerTokensAfter.ERC1155).to.equal(
        borrowerTokensBefore.ERC1155 + loanTokensBefore.ERC1155,
      );

      expect(loanTokensAfter.ERC1155).to.equal(0n);
    });

    it('successfully revokes a loan with multiple collaterals', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
        { collateralToken: collateralTokenB },
      ]);

      const [borrowerTokensABefore, loanTokensABefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          await loan.getAddress(),
        ]);

      const [borrowerTokensBBefore, loanTokensBBefore] =
        await getCurrentBalances(collateralTokenB, [
          borrower.address,
          await loan.getAddress(),
        ]);

      const isLoanActive = await loan.loanOfferActive();
      expect(isLoanActive).to.equal(true);

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      const isLoanActiveAfterTx = await loan.loanOfferActive();
      expect(isLoanActiveAfterTx).to.equal(false);

      const [borrowerTokensAAfter, loanTokensAAfter] = await getCurrentBalances(
        collateralTokenA,
        [borrower.address, await loan.getAddress()],
      );

      const [borrowerTokensBAfter, loanTokensBAfter] = await getCurrentBalances(
        collateralTokenB,
        [borrower.address, await loan.getAddress()],
      );

      expect(borrowerTokensAAfter.ERC1155).to.equal(
        borrowerTokensABefore.ERC1155 + loanTokensABefore.ERC1155,
      );

      expect(loanTokensAAfter.ERC1155).to.equal(0n);

      expect(borrowerTokensBAfter.ERC1155).to.equal(
        borrowerTokensBBefore.ERC1155 + loanTokensBBefore.ERC1155,
      );

      expect(loanTokensBAfter.ERC1155).to.equal(0n);
    });

    it('throws as msg sender is not borrower', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(loan.connect(lender).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Only borrower can revoke the loan',
      );
    });

    it('throws as cannot revoke twice', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer is revoked',
      );
    });

    it('throws as loan is provided', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan is already active',
      );
    });
  });

  describe('getRemainingTotalDue', () => {
    it('shows remaining total due', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), defaults.feeAmount)
      ).wait();

      expect(await loan.connect(borrower).getRemainingTotalDue()).to.equal(
        defaults.loanAmount + defaults.feeAmount,
      );

      await (await loan.processRepayment()).wait();

      expect(await loan.connect(borrower).getRemainingTotalDue()).to.equal(
        defaults.loanAmount,
      );
    });
    it('throws when loan is inactive', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(
        loan.connect(borrower).getRemainingTotalDue(),
      ).to.be.revertedWith('RoyaltyLoan: Loan is inactive');

      await (await loan.connect(lender).provideLoan()).wait();

      await expect(loan.connect(lender).getRemainingTotalDue()).not.to.be
        .reverted;

      await expect(
        loan.connect(deployer).getRemainingTotalDue(),
      ).to.be.revertedWith(
        'RoyaltyLoan: Only borrower and lender can see remaining total due',
      );
    });
    it('throws when called by non-lender/non-borrower', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await (await loan.connect(lender).provideLoan()).wait();

      await expect(loan.connect(lender).getRemainingTotalDue()).not.to.be
        .reverted;

      await expect(loan.connect(borrower).getRemainingTotalDue()).not.to.be
        .reverted;

      await expect(
        loan.connect(deployer).getRemainingTotalDue(),
      ).to.be.revertedWith(
        'RoyaltyLoan: Only borrower and lender can see remaining total due',
      );
    });
  });

  describe('reclaimExcessPaymentToken', () => {
    it('reclaims excess tokens before loan is active', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (
        await paymentToken.mintTo(await loan.getAddress(), defaults.loanAmount)
      ).wait();
      const [borrowerBalanceBefore, loanBalanceBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          await loan.getAddress(),
        ]);
      expect(borrowerBalanceBefore.ERC20).to.equal(0n);
      expect(loanBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [borrowerBalanceAfter, loanBalanceAfter] = await getCurrentBalances(
        collateralTokenA,
        [borrower.address, await loan.getAddress()],
      );
      expect(borrowerBalanceAfter.ERC20).to.equal(defaults.loanAmount);
      expect(loanBalanceAfter.ERC20).to.equal(0n);
    });

    it('reclaims excess tokens after loan is repaid', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount,
        )
      ).wait();

      await (await loan.processRepayment()).wait();

      const [borrowerBalanceBefore, loanBalanceBefore] =
        await getCurrentBalances(collateralTokenA, [
          borrower.address,
          await loan.getAddress(),
        ]);
      expect(borrowerBalanceBefore.ERC20).to.equal(defaults.loanAmount);
      expect(loanBalanceBefore.ERC20).to.equal(0n);

      await (
        await paymentToken.mintTo(await loan.getAddress(), defaults.loanAmount)
      ).wait();

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [borrowerBalanceAfter, loanBalanceAfter] = await getCurrentBalances(
        collateralTokenA,
        [borrower.address, await loan.getAddress()],
      );
      expect(borrowerBalanceAfter.ERC20).to.equal(defaults.loanAmount * 2n);
      expect(loanBalanceAfter.ERC20).to.equal(0n);
    });

    it('throws when loan is active', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'RoyaltyLoan: Loan is active',
      );
    });

    it('throws when loan balance is 0', async () => {
      const loan = await createLoanWithFactory(borrower, [
        { collateralToken: collateralTokenA },
      ]);

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'RoyaltyLoan: No payment token to process',
      );
    });
  });
});
