import { ethers } from 'hardhat';
import {
  AgreementERC1155,
  ERC20TokenMock,
  RoyaltyLoanFactory,
} from '../../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture, LoanState } from '../fixture';
import { ICollateral } from '../../typechain/contracts/Loans/interfaces/IBeneficiaryRoyaltyLoan';
import { HDNodeWallet, ZeroAddress } from 'ethers';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { createManyWallets, expectBalancesCreator } from '../utils';

let expect: Chai.ExpectStatic;

describe('BeneficiaryRoyaltyLoan', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;
  let beneficiaryA: SignerWithAddress;
  let beneficiaryB: SignerWithAddress;
  let beneficiaryC: SignerWithAddress;
  let beneficiaryD: SignerWithAddress;
  let beneficiaryE: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let collateralTokenA: AgreementERC1155;
  let collateralTokenB: AgreementERC1155;
  let loanFactory: RoyaltyLoanFactory;

  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let defaultBeneficiary: ICollateral.BeneficiaryStruct;

  let expectBalances: Awaited<ReturnType<typeof expectBalancesCreator>>;

  let createLoan: Awaited<ReturnType<typeof fixture>>['createLoan'];
  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();

    [
      deployer,
      lender,
      borrower,
      beneficiaryA,
      beneficiaryB,
      beneficiaryC,
      beneficiaryD,
      beneficiaryE,
    ] = deployment.signers;
    ({
      paymentToken,
      loanFactory,
      createLoan,
      defaults,
      deployAgreementERC1155,
    } = deployment);
    await (
      await paymentToken.mintTo(lender.address, defaults.loanAmount)
    ).wait();

    collateralTokenA = (
      await deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ])
    ).connect(deployer);

    collateralTokenB = (
      await deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount * 3n,
          isAdmin: true,
        },
      ])
    ).connect(deployer);

    defaultBeneficiary = {
      beneficiaryAddress: beneficiaryA.address,
      ppm: 1_000_000n,
    };

    expectBalances = expectBalancesCreator(expect, paymentToken);
  });

  describe('initialize', () => {
    // Not tested due to factory restrictions:
    // 'BeneficiaryRoyaltyLoan: Invalid payment token address'
    // 'BeneficiaryRoyaltyLoan: Collateral was not transferred in the required amount at position '
    // 'BeneficiaryRoyaltyLoan: Duration must be greater than 0'
    it('reverts with invalid args', async () => {
      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), true)
      ).wait();

      await expect(
        loanFactory
          .connect(borrower)
          .createBeneficiaryLoanContract(
            [],
            defaults.loanAmount,
            defaults.feePpm,
          ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: At least 1 collateral must be provided',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: ethers.ZeroAddress,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.reverted;
      // Without factory it should do:
      // 'BeneficiaryRoyaltyLoan: Invalid collateral token address',

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: 0n,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Collateral amount must be greater than 0',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: At least 1 beneficiary must be provided',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [
                { beneficiaryAddress: ZeroAddress, ppm: 1000000n },
              ],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Invalid beneficiary address',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [
                { beneficiaryAddress: beneficiaryA.address, ppm: 0n },
              ],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Beneficiary ppm must be greater than 0',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [
                { beneficiaryAddress: beneficiaryA.address, ppm: 100000n },
                { beneficiaryAddress: beneficiaryB.address, ppm: 100000n },
              ],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Beneficiaries ppm must sum to 1000000',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [
                { beneficiaryAddress: beneficiaryA.address, ppm: 500001n },
                { beneficiaryAddress: beneficiaryB.address, ppm: 500000n },
              ],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Beneficiaries ppm must sum to 1000000',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          0n,
          defaults.feePpm,
        ),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan amount must be greater than 0',
      );

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          defaults.loanAmount,
          1000001n,
        ),
      ).to.be.revertedWith('BeneficiaryRoyaltyLoan: FeePpm exceeds 100%');

      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), false)
      ).wait();

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).to.be.revertedWithCustomError(
        collateralTokenA,
        'ERC1155MissingApprovalForAll',
      );

      await (
        await collateralTokenA
          .connect(borrower)
          .setApprovalForAll(await loanFactory.getAddress(), true)
      ).wait();

      await expect(
        loanFactory.connect(borrower).createBeneficiaryLoanContract(
          [
            {
              tokenAddress: collateralTokenA,
              tokenAmount: defaults.collateralAmount,
              tokenId: defaults.collateralTokenId,
              beneficiaries: [defaultBeneficiary],
            },
          ],
          defaults.loanAmount,
          defaults.feePpm,
        ),
      ).not.to.be.reverted;
    });

    it('works with multiple collaterals', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
        {
          collateralToken: collateralTokenB,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      const blockNumber = await loan.runner?.provider?.getBlockNumber();

      if (!blockNumber) {
        throw new Error('Block number not found for deployment');
      }

      const beneficiaryLoanCreatedEvent = await loanFactory.queryFilter(
        loanFactory.getEvent('BeneficiaryLoanContractCreated'),
        blockNumber - 1,
        blockNumber - 1,
      );

      expect(
        beneficiaryLoanCreatedEvent[0].args.collaterals[0].tokenAddress,
      ).to.equal(await collateralTokenA.getAddress());
      expect(
        beneficiaryLoanCreatedEvent[0].args.collaterals[1].tokenAddress,
      ).to.equal(await collateralTokenB.getAddress());
    });
  });

  describe('provide loan', () => {
    it('successfully provides a loan', async () => {
      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
      ]);

      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;

      expect(await loan.loanState()).to.equal(LoanState.Active);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc20: defaults.loanAmount,
          erc1155: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
        },
      ]);
    });

    it('successfully provides a loan then throws as cannot provide loan twice', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await expect(loan.connect(lender).provideLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan is already active',
      );
    });

    it('throws as loan is not active', async () => {
      expectBalances(collateralTokenA, [
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: defaults.loanAmount,
        },
      ]);

      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan offer is revoked',
      );

      expectBalances(collateralTokenA, [
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: defaults.loanAmount,
        },
      ]);
    });

    it('throws as loan is expired', async () => {
      expectBalances(collateralTokenA, [
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: defaults.loanAmount,
        },
      ]);

      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await time.increase(defaults.duration + 1n);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan offer expired',
      );

      expectBalances(collateralTokenA, [
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: defaults.loanAmount,
        },
      ]);
    });
  });

  describe('processRepayment', () => {
    it('successfully makes full repayment', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

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

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: totalDue,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('successfully makes full repayment with exceeded balance', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

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

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: totalDue,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
          erc20: defaults.loanAmount,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('successfully makes partial repayments', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      const totalDue = defaults.feeAmount + defaults.loanAmount;

      const firstInstallment = ethers.parseUnits('5', 6);
      const secondInstallment = ethers.parseUnits('4', 6);
      const thirdInstallment = totalDue - firstInstallment - secondInstallment;

      await (
        await paymentToken.mintTo(borrower.address, defaults.feeAmount)
      ).wait();

      // First round
      expect(await loan.connect(lender).totalDue()).to.equal(totalDue);
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), firstInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc20: totalDue - firstInstallment,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: firstInstallment,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Active);

      // Second round
      expect(await loan.connect(lender).totalDue()).to.equal(
        totalDue - firstInstallment,
      );

      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), secondInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc20: totalDue - firstInstallment - secondInstallment,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: firstInstallment + secondInstallment,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Active);

      // Final round
      expect(await loan.connect(lender).totalDue()).to.equal(
        totalDue - firstInstallment - secondInstallment,
      );
      await (
        await paymentToken
          .connect(borrower)
          .transfer(await loan.getAddress(), thirdInstallment)
      ).wait();

      await expect(loan.connect(borrower).processRepayment()).not.to.be
        .reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: totalDue,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('works for multiple collaterals with multiple beneficiaries', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA.address, ppm: 500_000n },
            { beneficiaryAddress: beneficiaryB.address, ppm: 500_000n },
          ],
        },
        {
          collateralToken: collateralTokenB,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA.address, ppm: 700_000n },
            { beneficiaryAddress: beneficiaryB.address, ppm: 200_000n },
            { beneficiaryAddress: beneficiaryC.address, ppm: 100_000n },
          ],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiaryA',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryB.address,
          addressLabel: 'beneficiaryB',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount * 2n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiaryA',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryB.address,
          addressLabel: 'beneficiaryB',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryC.address,
          addressLabel: 'beneficiaryC',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

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

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: totalDue,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiaryA',
          erc1155: 500n,
          erc20: 0n,
        },
        {
          address: beneficiaryB.address,
          addressLabel: 'beneficiaryB',
          erc1155: 500n,
          erc20: 0n,
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount * 2n,
          erc20: 0n,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: totalDue,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiaryA',
          erc1155: 700n,
          erc20: 0n,
        },
        {
          address: beneficiaryB.address,
          addressLabel: 'beneficiaryB',
          erc1155: 200n,
          erc20: 0n,
        },
        {
          address: beneficiaryC.address,
          addressLabel: 'beneficiaryC',
          erc1155: 100n,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('triggers claimHolderFunds on AgreementsERC1155', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
        {
          collateralToken: collateralTokenB,
          beneficiaries: [defaultBeneficiary],
        }, // By default borrower has 3000 shares but 1000 were collateralized
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

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: await collateralTokenA.getAddress(),
          addressLabel: 'agreementA',
          erc20: ethers.parseUnits('10', 6),
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 2000n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
        },
        {
          address: await collateralTokenB.getAddress(),
          addressLabel: 'agreementB',
          erc20: ethers.parseUnits('30', 6),
        },
      ]);

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
      expect(collateralBEvents.length).to.equal(1);

      expect(collateralAEvents[0].args.account).to.equal(
        await loan.getAddress(),
      );
      expect(collateralAEvents[0].args.value).to.equal(
        ethers.parseUnits('10', 6).toString(),
      );

      expect(collateralBEvents[0].args.account).to.equal(
        await loan.getAddress(),
      );
      expect(collateralBEvents[0].args.value).to.equal(
        ethers.parseUnits('10', 6).toString(), // only 1/3 of shares were collateralized
      );

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
          erc20: defaults.feeAmount + defaults.loanAmount,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
          erc20: ethers.parseUnits('8', 6), // 10 from collA + 10 from collB - 12 totalDue = 8
        },
        {
          address: await collateralTokenA.getAddress(),
          addressLabel: 'agreementA',
          erc20: 0n,
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 2000n, // 1000 was sent to beneficiary
        },
        {
          address: lender.address,
          addressLabel: 'lender',
          erc1155: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
        },
        {
          address: await collateralTokenB.getAddress(),
          addressLabel: 'agreementB',
          erc20: ethers.parseUnits('20', 6),
        },
      ]);

      const borrowerClaimableAmount = await collateralTokenB.getClaimableAmount(
        await paymentToken.getAddress(),
        borrower.address,
      );

      expect(borrowerClaimableAmount.claimableAmount).to.equal(
        ethers.parseUnits('20', 6),
      );

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('throws as loan is not provided', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('BeneficiaryRoyaltyLoan: Loan is inactive');
    });

    it('throws as no USDC to process', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: No payment token to process',
      );
    });
  });

  describe('revokeLoan', () => {
    it('successfully revokes a loan with single collateral', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      expect(await loan.loanState()).to.equal(LoanState.Revoked);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);
    });

    it('successfully revokes a loan with multiple collaterals', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
        {
          collateralToken: collateralTokenB,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 2000n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      expect(await loan.loanState()).to.equal(LoanState.Revoked);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      await expectBalances(collateralTokenB, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 3000n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);
    });

    it('successfully revokes expired loan and gets paymentToken balance', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      const excessBalance = ethers.parseUnits('1', 6);

      await (
        await paymentToken.mintTo(await loan.getAddress(), excessBalance)
      ).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: excessBalance,
        },
      ]);

      await time.increase(defaults.duration + 1n);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan offer expired',
      );

      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: defaults.collateralAmount,
          erc20: excessBalance,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Revoked);
    });

    it('throws as msg sender is not borrower', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await expect(loan.connect(lender).revokeLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Only borrower can revoke the loan',
      );
    });

    it('throws as cannot revoke twice', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await expect(loan.connect(borrower).revokeLoan()).not.to.be.reverted;
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan offer is revoked',
      );
    });

    it('throws as loan is provided', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan is already active',
      );
    });
  });

  describe('reclaimExcessPaymentToken', () => {
    it('reclaims excess tokens to the borrower before loan is active', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await (
        await paymentToken.mintTo(await loan.getAddress(), defaults.loanAmount)
      ).wait();

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: defaults.loanAmount,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: 0n,
          erc20: 0n,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);
    });

    it('reclaims excess tokens to beneficiaries after loan is repaid', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount,
        )
      ).wait();

      await (await loan.connect(borrower).processRepayment()).wait();

      expect(await loan.loanState()).to.equal(LoanState.Repaid);

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
          erc20: 0n,
        },
      ]);

      const excessUSDC = ethers.parseUnits('1', 6);

      await (
        await paymentToken.mintTo(await loan.getAddress(), excessUSDC)
      ).wait();

      await expect(loan.reclaimExcessPaymentToken()).not.to.be.reverted;

      await expectBalances(collateralTokenA, [
        {
          address: borrower.address,
          addressLabel: 'borrower',
          erc1155: 0n,
          erc20: defaults.loanAmount,
        },
        {
          address: await loan.getAddress(),
          addressLabel: 'loan',
          erc1155: 0n,
          erc20: 0n,
        },
        {
          address: beneficiaryA.address,
          addressLabel: 'beneficiary',
          erc1155: defaults.collateralAmount,
          erc20: excessUSDC,
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Repaid);
    });

    it('throws when loan is active', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();

      expect(await loan.loanState()).to.equal(LoanState.Active);

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: Loan is active',
      );
    });

    it('throws when loan balance is 0', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          beneficiaries: [defaultBeneficiary],
        },
      ]);

      expect(await loan.loanState()).to.equal(LoanState.Pending);

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: No payment token to process',
      );

      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount,
        )
      ).wait();

      await (await loan.connect(borrower).processRepayment()).wait();

      expect(await loan.loanState()).to.equal(LoanState.Repaid);

      await expect(loan.reclaimExcessPaymentToken()).to.be.revertedWith(
        'BeneficiaryRoyaltyLoan: No payment token to process',
      );
    });
  });

  describe('_distributePaymentTokenToBeneficiaries', () => {
    it('works with uneven collateral weights', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          collateralAmount: 3,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA, ppm: 1_000_000n },
          ],
        },
        {
          collateralToken: collateralTokenB,
          collateralAmount: 7,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryB, ppm: 1_000_000n },
          ],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + 101n,
        )
      ).wait();
      await (await loan.processRepayment()).wait();

      expect(await paymentToken.balanceOf(beneficiaryA.address)).to.equal(30n);
      expect(await paymentToken.balanceOf(beneficiaryB.address)).to.equal(71n);
      expect(await paymentToken.balanceOf(await loan.getAddress())).to.equal(
        0n,
      );
    });

    it('works with very small payment, many collaterals', async () => {
      const collateralTokenC = await deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ]);
      const collateralTokenD = await deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ]);

      const collateralTokenE = await deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ]);

      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA, ppm: 1_000_000n },
          ],
        },
        {
          collateralToken: collateralTokenB,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryB, ppm: 1_000_000n },
          ],
        },
        {
          collateralToken: collateralTokenC,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryC, ppm: 1_000_000n },
          ],
        },
        {
          collateralToken: collateralTokenD,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryD, ppm: 1_000_000n },
          ],
        },
        {
          collateralToken: collateralTokenE,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryE, ppm: 1_000_000n },
          ],
        },
      ]);

      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + 3n,
        )
      ).wait();
      await (await loan.processRepayment()).wait();

      expect(await paymentToken.balanceOf(beneficiaryA.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryB.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryC.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryD.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryE.address)).to.equal(3n);
      expect(await paymentToken.balanceOf(await loan.getAddress())).to.equal(
        0n,
      );
    });

    it('works when PPM split causes dust', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          collateralAmount: 3,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryB, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryC, ppm: 333_334n },
          ],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + 101n,
        )
      ).wait();
      await (await loan.processRepayment()).wait();

      expect(await paymentToken.balanceOf(beneficiaryA.address)).to.equal(33n);
      expect(await paymentToken.balanceOf(beneficiaryB.address)).to.equal(33n);
      expect(await paymentToken.balanceOf(beneficiaryC.address)).to.equal(35n);
      expect(await paymentToken.balanceOf(await loan.getAddress())).to.equal(
        0n,
      );
    });

    it('works when payment < number of beneficiaries', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          collateralAmount: 3,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryB, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryC, ppm: 333_334n },
          ],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + 2n,
        )
      ).wait();
      await (await loan.processRepayment()).wait();

      expect(await paymentToken.balanceOf(beneficiaryA.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryB.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryC.address)).to.equal(2n);
      expect(await paymentToken.balanceOf(await loan.getAddress())).to.equal(
        0n,
      );
    });

    it('works with nested dust (collateral + beneficiary)', async () => {
      const loan = await createLoan.beneficiary(borrower, [
        {
          collateralToken: collateralTokenA,
          collateralAmount: 1,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryA, ppm: 500_000n },
            { beneficiaryAddress: beneficiaryB, ppm: 500_000n },
          ],
        },
        {
          collateralToken: collateralTokenB,
          collateralAmount: 2,
          beneficiaries: [
            { beneficiaryAddress: beneficiaryC, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryD, ppm: 333_333n },
            { beneficiaryAddress: beneficiaryE, ppm: 333_334n },
          ],
        },
      ]);
      await (await loan.connect(lender).provideLoan()).wait();
      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + 5n,
        )
      ).wait();
      await (await loan.processRepayment()).wait();

      expect(await paymentToken.balanceOf(beneficiaryA.address)).to.equal(0n);
      expect(await paymentToken.balanceOf(beneficiaryB.address)).to.equal(1n);
      expect(await paymentToken.balanceOf(beneficiaryC.address)).to.equal(1n);
      expect(await paymentToken.balanceOf(beneficiaryD.address)).to.equal(1n);
      expect(await paymentToken.balanceOf(beneficiaryE.address)).to.equal(2n);
      expect(await paymentToken.balanceOf(await loan.getAddress())).to.equal(
        0n,
      );
    });
  });
});
