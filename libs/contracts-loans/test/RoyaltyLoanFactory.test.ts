import { ethers } from 'hardhat';
import {
  AgreementERC1155,
  BeneficiaryRoyaltyLoan,
  BeneficiaryRoyaltyLoan__factory,
  ERC20TokenMock,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory,
  RoyaltyLoanFactory__factory,
} from '../typechain';
import { fixture } from './fixture';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { deployProxy } from '@royalty-loans/contracts-shared';

let expect: Chai.ExpectStatic;

describe('RoyaltyLoanFactory', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let operator: SignerWithAddress;
  let lender: SignerWithAddress;

  let loanFactory: RoyaltyLoanFactory;
  let standardLoanTemplate: RoyaltyLoan;
  let beneficiaryLoanTemplate: BeneficiaryRoyaltyLoan;
  let paymentToken: ERC20TokenMock;
  let collateralToken: AgreementERC1155;

  let createLoan: Awaited<ReturnType<typeof fixture>>['createLoan'];
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();
    [deployer, lender, borrower, operator] = deployment.signers;

    ({
      standardLoanTemplate,
      beneficiaryLoanTemplate,
      loanFactory,
      paymentToken,
      defaults,
      createLoan,
    } = deployment);

    collateralToken = (
      await deployment.deployAgreementERC1155([
        {
          account: borrower.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ])
    ).connect(deployer);
  });

  describe('initialize', () => {
    it('initializes correctly', async () => {
      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).not.to.be.reverted;
    });

    it('throws on reinitialization', async () => {
      loanFactory = await deployProxy(
        new RoyaltyLoanFactory__factory(deployer),
        [
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ],
      );
      await expect(
        loanFactory.initialize(
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ),
      ).to.be.reverted;
    });

    it('throws with invalid args', async () => {
      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          ethers.ZeroAddress,
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _templateAddress is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await standardLoanTemplate.getAddress(),
          ethers.ZeroAddress,
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _templateAddress is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          ethers.ZeroAddress,
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _paymentTokenAddress is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          0n,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _duration must be greater than 0',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await standardLoanTemplate.getAddress(),
          await beneficiaryLoanTemplate.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).not.to.be.reverted;
    });
  });

  describe('setTemplateAddress', () => {
    it('can be changed only by the owner', async () => {
      const newTemplate = await new RoyaltyLoan__factory(deployer).deploy();

      expect((await loanFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      await expect(
        loanFactory
          .connect(operator)
          .setTemplateAddress(0n, await newTemplate.getAddress()),
      ).to.be.reverted;

      await expect(
        loanFactory
          .connect(deployer)
          .setTemplateAddress(0n, await newTemplate.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on zero address', async () => {
      await expect(loanFactory.setTemplateAddress(0n, ethers.ZeroAddress)).to.be
        .reverted;
    });

    it('can modify different templates', async () => {
      const newStandardTemplate = await new RoyaltyLoan__factory(
        deployer,
      ).deploy();

      expect(await loanFactory.templates(0n)).not.to.equal(
        await newStandardTemplate.getAddress(),
      );

      await expect(
        loanFactory.setTemplateAddress(
          0n,
          await newStandardTemplate.getAddress(),
        ),
      ).not.to.be.reverted;

      expect(await loanFactory.templates(0n)).to.equal(
        await newStandardTemplate.getAddress(),
      );

      const newBeneficiaryTemplate = await new BeneficiaryRoyaltyLoan__factory(
        deployer,
      ).deploy();

      expect(await loanFactory.templates(1n)).not.to.equal(
        await newBeneficiaryTemplate.getAddress(),
      );

      await expect(
        loanFactory.setTemplateAddress(
          1n,
          await newBeneficiaryTemplate.getAddress(),
        ),
      ).not.to.be.reverted;

      expect(await loanFactory.templates(1n)).to.equal(
        await newBeneficiaryTemplate.getAddress(),
      );
    });
  });

  describe('setOfferDuration', () => {
    it('can be changed only by the owner', async () => {
      expect((await loanFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      await expect(loanFactory.connect(operator).setOfferDuration(1n)).to.be
        .reverted;

      await expect(loanFactory.connect(deployer).setOfferDuration(1n)).not.to.be
        .reverted;
    });

    it('throws on duration = 0', async () => {
      await expect(loanFactory.setOfferDuration(0n)).to.be.reverted;
    });
  });

  describe('createLoanContract', () => {
    it('creates loan contract and sends shares', async () => {
      const borrowerBalanceBefore = await collateralToken.balanceOf(
        borrower.address,
        defaults.collateralTokenId,
      );

      expect(borrowerBalanceBefore).to.equal(defaults.collateralAmount);

      const loan = await createLoan.standard(
        borrower,
        [
          {
            collateralAmount: defaults.collateralAmount,
            collateralToken: collateralToken,
          },
        ],
        {
          feePpm: 100n,
          loanAmount: 1n,
        },
      );

      const [borrowerBalanceAfter, loanContractBalanceAfter] =
        await collateralToken.balanceOfBatch(
          [borrower.address, await loan.getAddress()],
          [defaults.collateralTokenId, defaults.collateralTokenId],
        );

      expect(borrowerBalanceAfter).to.equal(0n);
      expect(loanContractBalanceAfter).to.equal(defaults.collateralAmount);
    });
  });

  describe('createBeneficiaryLoanContract', async () => {
    it('creates beneficiary loan contract and sends shares', async () => {
      const borrowerBalanceBefore = await collateralToken.balanceOf(
        borrower.address,
        defaults.collateralTokenId,
      );

      expect(borrowerBalanceBefore).to.equal(defaults.collateralAmount);

      const loan = await createLoan.beneficiary(
        borrower,
        [
          {
            collateralAmount: defaults.collateralAmount,
            collateralToken: collateralToken,
            beneficiaries: [
              {
                beneficiaryAddress: borrower.address,
                ppm: 1000000n,
              },
            ],
          },
        ],
        {
          feePpm: 100n,
          loanAmount: 1n,
        },
      );

      const [borrowerBalanceAfter, loanContractBalanceAfter] =
        await collateralToken.balanceOfBatch(
          [borrower.address, await loan.getAddress()],
          [defaults.collateralTokenId, defaults.collateralTokenId],
        );

      expect(borrowerBalanceAfter).to.equal(0n);
      expect(loanContractBalanceAfter).to.equal(defaults.collateralAmount);
    });
  });
});
