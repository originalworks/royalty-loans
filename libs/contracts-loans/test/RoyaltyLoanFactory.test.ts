import { ethers } from 'hardhat';
import {
  AgreementERC1155Mock,
  ERC20TokenMock,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory,
  RoyaltyLoanFactory__factory,
  Whitelist,
  Whitelist__factory,
} from '../typechain';
import { fixture, deployProxy } from './fixture';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

let expect: Chai.ExpectStatic;

describe('RoyaltyLoanFactory', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let operator: SignerWithAddress;

  let whitelist: Whitelist;
  let loanFactory: RoyaltyLoanFactory;
  let loanTemplate: RoyaltyLoan;
  let paymentToken: ERC20TokenMock;
  let collateralToken: AgreementERC1155Mock;

  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let createLoanWithFactory: Awaited<
    ReturnType<typeof fixture>
  >['createLoanWithFactory'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();
    [deployer, borrower, operator] = deployment.signers;

    ({
      whitelist,
      loanTemplate,
      loanFactory,
      collateralToken,
      paymentToken,
      defaults,
      createLoanWithFactory,
    } = deployment);
  });

  describe('initialize', () => {
    it('initializes correctly', async () => {
      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).not.to.be.reverted;
    });

    it('throws on reinitialization', async () => {
      loanFactory = await deployProxy(
        new RoyaltyLoanFactory__factory(deployer),
        [
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ],
      );
      await expect(
        loanFactory.initialize(
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ),
      ).to.be.reverted;
    });

    it('throws with invalid args', async () => {
      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          ethers.ZeroAddress,
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _templateAddress is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await loanTemplate.getAddress(),
          ethers.ZeroAddress,
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _whitelistAddress address is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          ethers.ZeroAddress,
          defaults.duration,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _paymentTokenAddress is the zero address',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          0n,
        ]),
      ).to.be.revertedWith(
        'RoyaltyLoanFactory: _duration must be greater than 0',
      );

      await expect(
        deployProxy(new RoyaltyLoanFactory__factory(deployer), [
          await loanTemplate.getAddress(),
          await whitelist.getAddress(),
          await paymentToken.getAddress(),
          defaults.duration,
        ]),
      ).not.to.be.reverted;
    });
  });

  describe('setTemplateAddress', () => {
    it('can be changed only by whitelisted address', async () => {
      const newTemplate = await new RoyaltyLoan__factory(deployer).deploy();
      expect(await whitelist.isWhitelisted(operator.address)).to.equal(false);
      await expect(
        loanFactory
          .connect(operator)
          .setTemplateAddress(await newTemplate.getAddress()),
      ).to.be.reverted;

      await (
        await whitelist.connect(deployer).addToWhitelist(operator.address)
      ).wait();

      await expect(
        loanFactory.setTemplateAddress(await newTemplate.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on zero address', async () => {
      await expect(loanFactory.setTemplateAddress(ethers.ZeroAddress)).to.be
        .reverted;
    });
  });

  describe('setWhitelistAddress', () => {
    it('can be changed only by whitelisted address', async () => {
      const newTemplate = await new Whitelist__factory(deployer).deploy(
        deployer.address,
      );
      expect(await whitelist.isWhitelisted(operator.address)).to.equal(false);
      await expect(
        loanFactory
          .connect(operator)
          .setWhitelistAddress(await newTemplate.getAddress()),
      ).to.be.reverted;

      await (
        await whitelist.connect(deployer).addToWhitelist(operator.address)
      ).wait();

      await expect(
        loanFactory.setWhitelistAddress(await newTemplate.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on zero address', async () => {
      await expect(loanFactory.setWhitelistAddress(ethers.ZeroAddress)).to.be
        .reverted;
    });
  });

  describe('setOfferDuration', () => {
    it('can be changed only by whitelisted address', async () => {
      expect(await whitelist.isWhitelisted(operator.address)).to.equal(false);
      await expect(loanFactory.connect(operator).setOfferDuration(1n)).to.be
        .reverted;

      await (
        await whitelist.connect(deployer).addToWhitelist(operator.address)
      ).wait();

      await expect(loanFactory.setOfferDuration(1n)).not.to.be.reverted;
    });

    it('throws on duration = 0', async () => {
      await expect(loanFactory.setOfferDuration(0n)).to.be.reverted;
    });
  });

  describe('createLoanContract', () => {
    it('creates loan contract and sends shares', async () => {
      await (await collateralToken.mint(borrower.address, 1n, 1n)).wait();

      const borrowerBalanceBefore = await collateralToken.balanceOf(
        borrower.address,
        1n,
      );

      expect(borrowerBalanceBefore).to.equal(1n);

      const loan = await createLoanWithFactory(borrower, {
        collateralAmount: 1n,
        feePpm: 100n,
        loanAmount: 1n,
      });

      const [borrowerBalanceAfter, loanContractBalanceAfter] =
        await collateralToken.balanceOfBatch(
          [borrower.address, await loan.getAddress()],
          [1n, 1n],
        );

      expect(borrowerBalanceAfter).to.equal(0n);
      expect(loanContractBalanceAfter).to.equal(1n);
    });
  });
});
