import { ethers } from 'hardhat';
import {
  AgreementERC1155,
  AgreementFactory,
  ERC20TokenMock,
  ERC20TokenMock__factory,
  RoyaltyAdvance,
  RoyaltyAdvance__factory,
  RoyaltyAdvanceFactory,
  RoyaltyAdvanceFactory__factory,
  TestERC1155__factory,
} from '../typechain';
import { fixture, RoyaltyAdvanceFactoryError } from './fixture';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { deployProxy } from '@royalty-loans/contracts-shared';
import { deployInitialSetup } from '@royalty-loans/contracts-agreements';
import { ZeroAddress } from 'ethers';
import { deployAgreementERC1155Creator } from './utils';

let expect: Chai.ExpectStatic;

describe('RoyaltyAdvanceFactory', () => {
  let deployer: SignerWithAddress;
  let recipient: SignerWithAddress;
  let operator: SignerWithAddress;
  let advancer: SignerWithAddress;

  let advanceFactory: RoyaltyAdvanceFactory;
  let advanceTemplate: RoyaltyAdvance;
  let agreementFactory: AgreementFactory;
  let paymentToken: ERC20TokenMock;
  let collateralToken: AgreementERC1155;

  let createAdvance: Awaited<ReturnType<typeof fixture>>['createAdvance'];
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let deployAgreementERC20: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC20'];
  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  before(async () => {
    expect = (await import('chai')).expect;
  });

  beforeEach(async () => {
    const deployment = await fixture();
    [deployer, advancer, recipient, operator] = deployment.signers;

    ({
      advanceTemplate,
      advanceFactory,
      paymentToken,
      defaults,
      createAdvance,
      agreementFactory,
      deployAgreementERC20,
      deployAgreementERC1155,
    } = deployment);

    collateralToken = (
      await deployment.deployAgreementERC1155([
        {
          account: recipient.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ])
    ).connect(deployer);
  });

  describe('initialize', () => {
    it('initializes correctly', async () => {
      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ]),
      ).not.to.be.reverted;
    });

    it('throws on reinitialization', async () => {
      advanceFactory = await deployProxy(
        new RoyaltyAdvanceFactory__factory(deployer),
        [
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ],
      );
      await expect(
        advanceFactory.initialize(
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ),
      ).to.be.reverted;
    });

    it('throws with invalid args', async () => {
      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          ethers.ZeroAddress,
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ]),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroTemplateAddress,
      );

      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          ethers.ZeroAddress,
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ]),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroPaymentTokenAddress,
      );

      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          ethers.ZeroAddress,
          defaults.duration,
          100n,
        ]),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.NotAgreementFactory,
      );

      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          await agreementFactory.getAddress(),
          await paymentToken.getAddress(),
          0n,
          100n,
        ]),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroDuration,
      );

      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          0n,
        ]),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroMaxCollateralsPerAdvance,
      );

      await expect(
        deployProxy(new RoyaltyAdvanceFactory__factory(deployer), [
          await advanceTemplate.getAddress(),
          await paymentToken.getAddress(),
          await agreementFactory.getAddress(),
          defaults.duration,
          100n,
        ]),
      ).not.to.be.reverted;
    });
  });

  describe('setTemplateAddress', () => {
    it('can be changed only by the owner', async () => {
      const newTemplate = await new RoyaltyAdvance__factory(deployer).deploy();

      expect((await advanceFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      await expect(
        advanceFactory
          .connect(operator)
          .setTemplateAddress(await newTemplate.getAddress()),
      ).to.be.reverted;

      await expect(
        advanceFactory
          .connect(deployer)
          .setTemplateAddress(await newTemplate.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on zero address', async () => {
      await expect(
        advanceFactory.setTemplateAddress(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroTemplateAddress,
      );
    });
  });

  describe('setOfferDuration', () => {
    it('can be changed only by the owner', async () => {
      expect((await advanceFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      await expect(advanceFactory.connect(operator).setOfferDuration(1n)).to.be
        .reverted;

      await expect(advanceFactory.connect(deployer).setOfferDuration(1n)).not.to
        .be.reverted;
    });

    it('throws on duration = 0', async () => {
      await expect(
        advanceFactory.setOfferDuration(0n),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroDuration,
      );
    });
  });

  describe('setPaymentTokenAddress', () => {
    it('can be changed only by the owner', async () => {
      expect((await advanceFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      const newPaymentToken = await (
        await new ERC20TokenMock__factory(deployer).deploy()
      ).waitForDeployment();

      await expect(
        advanceFactory
          .connect(operator)
          .setPaymentTokenAddress(await newPaymentToken.getAddress()),
      ).to.be.reverted;

      await expect(
        advanceFactory
          .connect(deployer)
          .setPaymentTokenAddress(await newPaymentToken.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on zero address', async () => {
      await expect(
        advanceFactory.setPaymentTokenAddress(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroPaymentTokenAddress,
      );
    });
  });

  describe('setAgreementFactoryAddress', () => {
    it('can be changed only by the owner', async () => {
      expect((await advanceFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      const { agreementFactory } = await deployInitialSetup();

      await expect(
        advanceFactory
          .connect(operator)
          .setAgreementFactoryAddress(await agreementFactory.getAddress()),
      ).to.be.reverted;

      await expect(
        advanceFactory
          .connect(deployer)
          .setAgreementFactoryAddress(await agreementFactory.getAddress()),
      ).not.to.be.reverted;
    });

    it('throws on invalid interface', async () => {
      await expect(
        advanceFactory.setAgreementFactoryAddress(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.NotAgreementFactory,
      );

      await expect(
        advanceFactory.setAgreementFactoryAddress(
          await paymentToken.getAddress(),
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.NotAgreementFactory,
      );
    });
  });

  describe('setMaxCollateralsPerAdvance', () => {
    it('can be changed only by the owner', async () => {
      expect((await advanceFactory.owner()).toLowerCase()).not.to.equal(
        operator.address.toLowerCase(),
      );

      await expect(
        advanceFactory.connect(operator).setMaxCollateralsPerAdvance(1n),
      ).to.be.reverted;

      await expect(
        advanceFactory.connect(deployer).setMaxCollateralsPerAdvance(1n),
      ).not.to.be.reverted;
    });

    it('throws on maxCollateralsPerAdvance = 0', async () => {
      await expect(
        advanceFactory.setMaxCollateralsPerAdvance(0n),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroMaxCollateralsPerAdvance,
      );
    });
  });

  describe('createAdvanceContract', () => {
    it('limits collaterals amount', async () => {
      await advanceFactory.setMaxCollateralsPerAdvance(1);
      const collateralB = await deployAgreementERC1155([
        {
          account: recipient.address,
          balance: defaults.collateralAmount,
          isAdmin: true,
        },
      ]);

      await expect(
        advanceFactory.createAdvanceContract(
          [
            {
              tokenAddress: await collateralToken.getAddress(),
              tokenAmount: 1n,
              tokenId: 1,
            },
            {
              tokenAddress: await collateralB.getAddress(),
              tokenAmount: 1n,
              tokenId: 1,
            },
          ],
          recipient.address,
          1n,
          1n,
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.TooManyCollaterals,
      );
    });

    it('validates collaterals', async () => {
      await expect(
        advanceFactory.createAdvanceContract(
          [{ tokenAddress: ZeroAddress, tokenAmount: 1n, tokenId: 1 }],
          recipient.address,
          1n,
          1n,
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.ZeroCollateralTokenAddress,
      );

      const agreementERC20 = await deployAgreementERC20([
        { account: recipient.address, balance: 100n, isAdmin: true },
      ]);

      await expect(
        advanceFactory.createAdvanceContract(
          [
            {
              tokenAddress: await agreementERC20.getAddress(),
              tokenAmount: 1n,
              tokenId: 1,
            },
          ],
          recipient.address,
          1n,
          1n,
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.CollateralNotERC1155,
      );

      const testERC1155 = await (
        await new TestERC1155__factory(deployer).deploy()
      ).waitForDeployment();

      await expect(
        advanceFactory.createAdvanceContract(
          [
            {
              tokenAddress: await testERC1155.getAddress(),
              tokenAmount: 1n,
              tokenId: 1,
            },
          ],
          recipient.address,
          1n,
          1n,
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.CollateralNotRegistered,
      );

      const { agreementFactory: altAgreementFactory } =
        await deployInitialSetup({
          creationFee: 0n,
          paymentFee: 0n,
        });

      const deployAltAgreementERC1155 = deployAgreementERC1155Creator(
        deployer,
        await altAgreementFactory.getAddress(),
      );

      const altAgreementERC1155 = await deployAltAgreementERC1155([
        { account: recipient.address, balance: 100n, isAdmin: true },
      ]);

      await expect(
        advanceFactory.createAdvanceContract(
          [
            {
              tokenAddress: await altAgreementERC1155.getAddress(),
              tokenAmount: 1n,
              tokenId: 1,
            },
          ],
          recipient.address,
          1n,
          1n,
        ),
      ).to.be.revertedWithCustomError(
        advanceFactory,
        RoyaltyAdvanceFactoryError.CollateralNotRegistered,
      );
    });

    it('creates advance contract and sends shares', async () => {
      const recipientBalanceBefore = await collateralToken.balanceOf(
        recipient.address,
        defaults.collateralTokenId,
      );

      expect(recipientBalanceBefore).to.equal(defaults.collateralAmount);

      const advance = await createAdvance.standard(
        recipient,
        [
          {
            collateralAmount: defaults.collateralAmount,
            collateralToken: collateralToken,
          },
        ],
        {
          feePpm: 100n,
          advanceAmount: 1n,
        },
      );

      const [recipientBalanceAfter, advanceContractBalanceAfter] =
        await collateralToken.balanceOfBatch(
          [recipient.address, await advance.getAddress()],
          [defaults.collateralTokenId, defaults.collateralTokenId],
        );

      expect(recipientBalanceAfter).to.equal(0n);
      expect(advanceContractBalanceAfter).to.equal(defaults.collateralAmount);
    });
  });
});
