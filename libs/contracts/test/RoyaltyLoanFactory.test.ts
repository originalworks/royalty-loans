import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  AgreementFactory,
  FeeManager,
} from '@original-works/contracts-agreements-typechain'
import {
  ERC20TokenMock,
  RoyaltyLoan,
  RoyaltyLoan__factory,
  RoyaltyLoanFactory,
  RoyaltyLoanFactory__factory,
  TransparentUpgradeableProxy__factory,
  Whitelist,
  Whitelist__factory,
} from '../typechain'
import { createERC1155, getEvent, initialDeployment } from './utils'

describe('RoyaltyLoanFactory', () => {
  let whitelist: Whitelist

  let template: RoyaltyLoan
  let factory: RoyaltyLoanFactory

  let deployer: SignerWithAddress
  let operationalAcc: SignerWithAddress
  let proxyAdmin: SignerWithAddress
  let borrower: SignerWithAddress
  let holder2: SignerWithAddress

  let trackedToken: ERC20TokenMock
  let agreementFactory: AgreementFactory
  let feeManager: FeeManager

  const fee = 10
  const offerDuration = 10

  beforeEach(async () => {
    ;[deployer, operationalAcc, proxyAdmin, borrower, holder2] =
      await ethers.getSigners()

    whitelist = await new Whitelist__factory(deployer).deploy(deployer.address)

    await whitelist.addToWhitelist(operationalAcc.address)

    template = await new RoyaltyLoan__factory(deployer).deploy()
    const initialContracts = await initialDeployment(deployer)
    trackedToken = initialContracts.trackedToken
    agreementFactory = initialContracts.agreementFactory
    feeManager = initialContracts.feeManager

    const factoryImplementation = await new RoyaltyLoanFactory__factory(
      deployer,
    ).deploy(trackedToken.address)

    const { data } = await factoryImplementation.populateTransaction.initialize(
      template.address,
      deployer.address,
      whitelist.address,
      fee,
      offerDuration,
    )

    const factoryProxy = await new TransparentUpgradeableProxy__factory(
      deployer,
    ).deploy(factoryImplementation.address, proxyAdmin.address, data ?? '0x')

    factory = RoyaltyLoanFactory__factory.connect(
      factoryProxy.address,
      deployer,
    )
  })

  describe('initialize', () => {
    it('is locked for implementation contract', async () => {
      await expect(
        factory.initialize(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          fee,
          offerDuration,
        ),
      ).to.be.revertedWith('Initializable: contract is already initialized')
    })
  })

  describe('templateAddress', () => {
    it('can be changed by owner', async () => {
      const newTemplate = await new RoyaltyLoan__factory(deployer).deploy()

      await expect(
        factory.connect(operationalAcc).setTemplateAddress(newTemplate.address),
      ).to.be.revertedWith('Ownable: caller is not the owner')

      const tx = factory.setTemplateAddress(newTemplate.address)

      const templateChangedEvent = await getEvent(
        tx,
        factory,
        'TemplateChanged(address,address)',
      )

      expect(templateChangedEvent.args[0]).eq(template.address)
      expect(templateChangedEvent.args[1]).eq(newTemplate.address)

      expect(await factory.templateAddress()).to.equal(newTemplate.address)
    })
  })

  describe('whitelist', () => {
    it('can be changed by owner', async () => {
      const newWhitelist = await new Whitelist__factory(deployer).deploy(
        deployer.address,
      )

      await expect(
        factory
          .connect(operationalAcc)
          .setWhitelistAddress(newWhitelist.address),
      ).to.be.revertedWith('Ownable: caller is not the owner')

      const tx = factory.setWhitelistAddress(newWhitelist.address)
      const whitelistChangedEvent = await getEvent(
        tx,
        factory,
        'WhitelistChanged(bytes1,address,address)',
      )

      const [_whitelistId, _previousAddress, _newAddress] =
        whitelistChangedEvent.args

      expect(_newAddress).to.equal(newWhitelist.address)
      expect(_previousAddress).to.equal(whitelist.address)
      expect(_whitelistId).to.equal(await factory.OPERATIONAL_WHITELIST())

      expect(
        await factory.whitelists(await factory.OPERATIONAL_WHITELIST()),
      ).to.equal(newWhitelist.address)
    })

    it('fails if address is not a whitelist', async () => {
      await expect(
        factory.setWhitelistAddress(ethers.Wallet.createRandom().address),
      ).to.be.revertedWith('Interface not supported')
    })
  })

  describe('createLoanContract', () => {
    it('creates loan contract and sends shares', async () => {
      const holders = [
        { account: borrower.address, balance: 600, isAdmin: true },
        { account: holder2.address, balance: 400, isAdmin: true },
      ]

      const agreement = await createERC1155(
        deployer,
        holders,
        agreementFactory,
        feeManager,
      )

      const collateralToken = agreement.address
      const collateralTokenId = 1
      const collateralAmount = 400
      const loanAmount = 3

      const balanceBeforeLoan = await agreement.balanceOf(
        borrower.address,
        collateralTokenId,
      )
      expect(balanceBeforeLoan.toString()).to.equal('600')

      const approvalTx = await agreement
        .connect(borrower)
        .setApprovalForAll(factory.address, true)
      await approvalTx.wait()

      const loanCreationTx = factory
        .connect(borrower)
        .createLoanContract(
          collateralToken,
          collateralTokenId,
          collateralAmount,
          loanAmount,
        )

      const royaltyLoanCretionEvent = await getEvent(
        loanCreationTx,
        factory,
        'LoanContractCreated(address,address,address,uint256)',
      )
      const [royaltyLoanAddress] = royaltyLoanCretionEvent.args

      const royaltyLoan = factory.attach(royaltyLoanAddress)
      expect(royaltyLoan.address).to.properAddress

      const balanceAfterLoan = await agreement.balanceOf(
        borrower.address,
        collateralTokenId,
      )
      expect(balanceAfterLoan.toString()).to.equal('200')
      const loanContractBalance = await agreement.balanceOf(
        royaltyLoan.address,
        collateralTokenId,
      )
      expect(loanContractBalance.toString()).to.equal('400')
    })

    it('fails as loan amount exceeds holder balance', async () => {
      const holders = [
        { account: borrower.address, balance: 600, isAdmin: true },
        { account: holder2.address, balance: 400, isAdmin: true },
      ]

      const agreement = await createERC1155(
        deployer,
        holders,
        agreementFactory,
        feeManager,
      )

      const collateralToken = agreement.address
      const collateralTokenId = 1
      const collateralAmount = 800
      const loanAmount = 3

      const balanceBeforeLoan = await agreement.balanceOf(
        borrower.address,
        collateralTokenId,
      )
      expect(balanceBeforeLoan.toString()).to.equal('600')

      const approvalTx = await agreement
        .connect(borrower)
        .setApprovalForAll(factory.address, true)
      await approvalTx.wait()
      await expect(
        factory
          .connect(borrower)
          .createLoanContract(
            collateralToken,
            collateralTokenId,
            collateralAmount,
            loanAmount,
          ),
      ).to.be.revertedWith('ERC1155: insufficient balance for transfer')
    })

    it('fails as invalid token collateral', async () => {
      const collateralToken = '0x0000000000000000000000000000000000000000'
      const collateralTokenId = 1
      const collateralAmount = 800
      const loanAmount = 3

      await expect(
        factory
          .connect(borrower)
          .createLoanContract(
            collateralToken,
            collateralTokenId,
            collateralAmount,
            loanAmount,
          ),
      ).to.be.revertedWith('Invalid collateral token address')
    })

    it('fails as collateral amount is zero', async () => {
      const holders = [
        { account: borrower.address, balance: 600, isAdmin: true },
        { account: holder2.address, balance: 400, isAdmin: true },
      ]

      const agreement = await createERC1155(
        deployer,
        holders,
        agreementFactory,
        feeManager,
      )

      const collateralToken = agreement.address
      const collateralTokenId = 1
      const collateralAmount = 0
      const loanAmount = 3

      const approvalTx = await agreement
        .connect(borrower)
        .setApprovalForAll(factory.address, true)
      await approvalTx.wait()
      await expect(
        factory
          .connect(borrower)
          .createLoanContract(
            collateralToken,
            collateralTokenId,
            collateralAmount,
            loanAmount,
          ),
      ).to.be.revertedWith('Collateral amount must be greater than 0')
    })

    it('fails as loan amount is zero', async () => {
      const holders = [
        { account: borrower.address, balance: 600, isAdmin: true },
        { account: holder2.address, balance: 400, isAdmin: true },
      ]

      const agreement = await createERC1155(
        deployer,
        holders,
        agreementFactory,
        feeManager,
      )

      const collateralToken = agreement.address
      const collateralTokenId = 1
      const collateralAmount = 400
      const loanAmount = 0

      const approvalTx = await agreement
        .connect(borrower)
        .setApprovalForAll(factory.address, true)
      await approvalTx.wait()
      await expect(
        factory
          .connect(borrower)
          .createLoanContract(
            collateralToken,
            collateralTokenId,
            collateralAmount,
            loanAmount,
          ),
      ).to.be.revertedWith('Loan amount must be greater than 0')
    })
  })

  describe('setFee', () => {
    it('sets new fee', async () => {
      const newFee = 20
      const fee = await factory.fee()
      expect(fee.toString()).to.equal('10')
      const setFeeTx = await factory.connect(operationalAcc).setFee(newFee)
      await setFeeTx.wait()

      const feeAfterChange = await factory.fee()
      expect(feeAfterChange.toString()).to.equal(newFee.toString())
    })

    it('throws as new fee is zero', async () => {
      const newFee = 0
      const fee = await factory.fee()
      expect(fee.toString()).to.equal('10')
      await expect(
        factory.connect(operationalAcc).setFee(newFee),
      ).to.be.revertedWith('Fee must be greater than 0')
    })

    it('throws as sender is not whitelisted', async () => {
      const newFee = 20
      const fee = await factory.fee()
      expect(fee.toString()).to.equal('10')
      await expect(factory.connect(holder2).setFee(newFee)).to.be.revertedWith(
        'Sender is not whitelisted',
      )
    })
  })

  describe('setOfferDuration', () => {
    it('sets new offer duration', async () => {
      const newOfferDuration = 20
      const offerDuration = await factory.offerDuration()
      expect(offerDuration.toString()).to.equal('10')
      const setOfferDuration = await factory
        .connect(operationalAcc)
        .setOfferDuration(newOfferDuration)
      await setOfferDuration.wait()

      const offerDurationAfterChange = await factory.offerDuration()
      expect(offerDurationAfterChange.toString()).to.equal(
        newOfferDuration.toString(),
      )
    })

    it('throws as new offer duration is zero', async () => {
      const newOfferDuration = 0
      const offerDuration = await factory.offerDuration()
      expect(offerDuration.toString()).to.equal('10')
      await expect(
        factory.connect(operationalAcc).setOfferDuration(newOfferDuration),
      ).to.be.revertedWith('Duration must be greater than 0')
    })

    it('throws as sender is not whitelisted', async () => {
      const newOfferDuration = 20
      const offerDuration = await factory.offerDuration()
      expect(offerDuration.toString()).to.equal('10')
      await expect(
        factory.connect(holder2).setOfferDuration(newOfferDuration),
      ).to.be.revertedWith('Sender is not whitelisted')
    })
  })
})
