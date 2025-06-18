import { ethers } from 'hardhat';
import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { AgreementERC1155Mock, ERC20TokenMock } from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from './fixture';

describe('RoyaltyLoanFactory', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let collateralToken: AgreementERC1155Mock;

  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];

  let getCurrentBalances: Awaited<
    ReturnType<typeof fixture>
  >['getCurrentBalances'];

  let createLoanWithFactory: Awaited<
    ReturnType<typeof fixture>
  >['createLoanWithFactory'];

  let deployLoan: Awaited<ReturnType<typeof fixture>>['deployLoan'];

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, borrower, lender] = deployment.signers;
    ({
      paymentToken,
      collateralToken,
      deployLoan,
      getCurrentBalances,
      createLoanWithFactory,
      defaults,
    } = deployment);

    await (
      await collateralToken.mint(
        borrower.address,
        defaults.collateralTokenId,
        defaults.collateralAmount,
      )
    ).wait();

    await (
      await paymentToken.mintTo(lender.address, defaults.loanAmount)
    ).wait();
  });

  describe('initialize', () => {
    it('reverts with invalid args', async () => {
      await expect(
        deployLoan(borrower, {
          collateralTokenAddress: ethers.ZeroAddress,
        }),
      ).to.be.revertedWith('RoyaltyLoan: Invalid collateral token address');

      await expect(
        deployLoan(borrower, { collateralAmount: '0' }),
      ).to.be.revertedWith(
        'RoyaltyLoan: Collateral amount must be greater than 0',
      );

      await expect(
        deployLoan(borrower, { loanAmount: '0' }),
      ).to.be.revertedWith('RoyaltyLoan: Loan amount must be greater than 0');

      await expect(
        deployLoan(borrower, { feePpm: '1000001' }),
      ).to.be.revertedWith('RoyaltyLoan: FeePpm exceeds 100%');

      await expect(
        deployLoan(borrower, { paymentTokenAddress: ethers.ZeroAddress }),
      ).to.be.revertedWith('RoyaltyLoan: Invalid payment token address');

      await expect(deployLoan(borrower, { duration: 0 })).to.be.revertedWith(
        'RoyaltyLoan: Duration must be greater than 0',
      );

      await expect(deployLoan(borrower)).to.be.revertedWith(
        'RoyaltyLoan: Collateral was not transferred in the required amount',
      );

      await expect(
        createLoanWithFactory(borrower, { noApprove: true }),
      ).to.be.revertedWithCustomError(
        collateralToken,
        'ERC1155MissingApprovalForAll',
      );

      await expect(createLoanWithFactory(borrower)).not.to.be.reverted;
    });
  });

  describe('provide loan', () => {
    it('successfully provides a loan', async () => {
      const [borrowerBalancesBefore, lenderBalancesBefore] =
        await getCurrentBalances([borrower.address, lender.address]);
      expect(borrowerBalancesBefore.ERC1155).to.equal(
        defaults.collateralAmount,
      );
      expect(borrowerBalancesBefore.ERC20).to.equal(0n);
      expect(lenderBalancesBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower);

      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;

      const [borrowerBalancesAfter, lenderBalancesAfter, loanBalancesAfter] =
        await getCurrentBalances([
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
      const loan = await createLoanWithFactory(borrower);
      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan is already active',
      );
    });

    it('throws as loan is not active', async () => {
      const [lenderBalanceBefore] = await getCurrentBalances([lender.address]);
      expect(lenderBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer is revoked',
      );

      const [lenderBalanceAfter] = await getCurrentBalances([lender.address]);
      expect(lenderBalanceAfter.ERC20).to.equal(defaults.loanAmount);
    });

    it('throws as loan is expired', async () => {
      const [lenderBalanceBefore] = await getCurrentBalances([lender.address]);
      expect(lenderBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      const loan = await createLoanWithFactory(borrower);
      await time.increase(defaults.duration + 1n);

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer expired',
      );

      const [lenderBalanceAfter] = await getCurrentBalances([lender.address]);
      expect(lenderBalanceAfter.ERC20).to.equal(defaults.loanAmount);
    });
  });

  describe('processRepayment', () => {
    it('successfully makes full repayment', async () => {
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances([
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
        await getCurrentBalances([
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
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances([
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
        await getCurrentBalances([
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
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();

      const [borrowerBalancesBefore, lenderBalancesBefore, loanBalancesBefore] =
        await getCurrentBalances([
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
      ] = await getCurrentBalances([
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
      ] = await getCurrentBalances([
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
      ] = await getCurrentBalances([
        borrower.address,
        lender.address,
        await loan.getAddress(),
      ]);

      expect(borrowerBalancesAfterFinal.ERC20).to.equal(0n);
      expect(lenderBalancesAfterFinal.ERC20).to.equal(totalDue);
      expect(loanBalancesAfterFinal.ERC20).to.equal(0n);

      expect(await loan.loanActive()).to.equal(false);
    });

    it('throws as loan is not provided', async () => {
      const loan = await createLoanWithFactory(borrower);

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('RoyaltyLoan: Loan is inactive');
    });

    it('throws as no USDC to process', async () => {
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('RoyaltyLoan: No payment token to process');
    });
  });

  describe('revokeLoan', () => {
    it('successfully revokes a loan', async () => {
      const loan = await createLoanWithFactory(borrower);

      const isLoanActive = await loan.loanOfferActive();
      expect(isLoanActive).to.equal(true);

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      const isLoanActiveAfterTx = await loan.loanOfferActive();
      expect(isLoanActiveAfterTx).to.equal(false);
    });

    it('throws as msg sender is not borrower', async () => {
      const loan = await createLoanWithFactory(borrower);

      await expect(loan.connect(lender).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Only borrower can revoke the loan',
      );
    });

    it('throws as cannot revoke twice', async () => {
      const loan = await createLoanWithFactory(borrower);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan offer is revoked',
      );
    });

    it('throws as loan is provided', async () => {
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'RoyaltyLoan: Loan is already active',
      );
    });
  });

  describe('getRemainingTotalDue', () => {
    it('shows remaining total due', async () => {
      const loan = await createLoanWithFactory(borrower);
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
      const loan = await createLoanWithFactory(borrower);

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
      const loan = await createLoanWithFactory(borrower);

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
      const loan = await createLoanWithFactory(borrower);
      await (
        await paymentToken.mintTo(await loan.getAddress(), defaults.loanAmount)
      ).wait();
      const [borrowerBalanceBefore, loanBalanceBefore] =
        await getCurrentBalances([borrower.address, await loan.getAddress()]);
      expect(borrowerBalanceBefore.ERC20).to.equal(0n);
      expect(loanBalanceBefore.ERC20).to.equal(defaults.loanAmount);

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [borrowerBalanceAfter, loanBalanceAfter] = await getCurrentBalances(
        [borrower.address, await loan.getAddress()],
      );
      expect(borrowerBalanceAfter.ERC20).to.equal(defaults.loanAmount);
      expect(loanBalanceAfter.ERC20).to.equal(0n);
    });

    it('reclaims excess tokens after loan is repaid', async () => {
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount,
        )
      ).wait();

      await (await loan.processRepayment()).wait();

      const [borrowerBalanceBefore, loanBalanceBefore] =
        await getCurrentBalances([borrower.address, await loan.getAddress()]);
      expect(borrowerBalanceBefore.ERC20).to.equal(defaults.loanAmount);
      expect(loanBalanceBefore.ERC20).to.equal(0n);

      await (
        await paymentToken.mintTo(await loan.getAddress(), defaults.loanAmount)
      ).wait();

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      const [borrowerBalanceAfter, loanBalanceAfter] = await getCurrentBalances(
        [borrower.address, await loan.getAddress()],
      );
      expect(borrowerBalanceAfter.ERC20).to.equal(defaults.loanAmount * 2n);
      expect(loanBalanceAfter.ERC20).to.equal(0n);
    });

    it('throws when loan is active', async () => {
      const loan = await createLoanWithFactory(borrower);
      await (await loan.connect(lender).provideLoan()).wait();

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'RoyaltyLoan: Loan is active',
      );
    });

    it('throws when loan balance is 0', async () => {
      const loan = await createLoanWithFactory(borrower);

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'RoyaltyLoan: No payment token to process',
      );
    });
  });
});
