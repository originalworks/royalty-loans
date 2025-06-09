import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  AgreementFactory,
  deployProxy,
  FeeManager,
} from '@original-works/contracts-agreements-typechain'
import { AgreementERC1155 } from '@original-works/contracts-agreements-typechain/dist/typechain/contracts/agreements/AgreementERC1155'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { BigNumber } from 'ethers'
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

const createLoan = async (
  agreement: AgreementERC1155,
  collateralAmount: BigNumber,
  loanAmount: BigNumber,
  factory: RoyaltyLoanFactory,
  borrower: SignerWithAddress,
): Promise<RoyaltyLoan> => {
  const collateralToken = agreement.address
  const collateralTokenId = 1

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

  const royaltyLoan = new RoyaltyLoan__factory(borrower).attach(
    royaltyLoanAddress,
  )
  return royaltyLoan
}

const provideLoan = async (
  collateralAmount: BigNumber,
  loanAmount: BigNumber,
  borrower: SignerWithAddress,
  lender: SignerWithAddress,
  agreement: AgreementERC1155,
  factory: RoyaltyLoanFactory,
  trackedToken: ERC20TokenMock,
) => {
  const loan = await createLoan(
    agreement,
    collateralAmount,
    loanAmount,
    factory,
    borrower,
  )
  const approveTx = await trackedToken
    .connect(lender)
    .approve(loan.address, loanAmount)
  await approveTx.wait()
  const provideLoanTx = await loan.connect(lender).provideLoan()
  await provideLoanTx.wait()

  return loan
}

describe('RoyaltyLoanFactory', () => {
  let whitelist: Whitelist

  let deployer: SignerWithAddress
  let operationalAcc: SignerWithAddress
  let proxyAdmin: SignerWithAddress
  let borrower: SignerWithAddress
  let holder2: SignerWithAddress
  let lender: SignerWithAddress
  let lenderWithoutTrackedTokens: SignerWithAddress

  let trackedToken: ERC20TokenMock
  let agreementFactory: AgreementFactory
  let feeManager: FeeManager
  let factory: RoyaltyLoanFactory
  let template: RoyaltyLoan

  const fee = ethers.utils.parseUnits('1', 6)
  const offerDuration = 10 // 10 seconds

  beforeEach(async () => {
    ;[
      deployer,
      operationalAcc,
      proxyAdmin,
      borrower,
      holder2,
      lender,
      lenderWithoutTrackedTokens,
    ] = await ethers.getSigners()

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

    const mintTx = await trackedToken.mintTo(
      lender.address,
      ethers.utils.parseUnits(`100000`, 6),
    )
    await mintTx.wait()
  })

  describe('initialize', () => {
    it('successfully using factory', async () => {
      const royaltyLoanFactory = new RoyaltyLoan__factory()
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

      const collateralTokenId = 1
      const collateralAmount = 400
      const loanAmount = 0
      const royaltyLoan = await deployProxy(
        royaltyLoanFactory.connect(deployer),
        [
          trackedToken.address,
          agreement.address,
          borrower.address,
          fee,
          collateralTokenId,
          collateralAmount,
          loanAmount,
          offerDuration,
        ],
      )

      expect(royaltyLoan.address).to.properAddress
    })

    it('fails as wrong tracked token address', async () => {
      const royaltyLoanFactory = new RoyaltyLoan__factory()

      const collateralToken = '0x0000000000000000000000000000000000000000'

      const collateralTokenId = 1
      const collateralAmount = 400
      const loanAmount = 0
      const royaltyLoan = await deployProxy(
        royaltyLoanFactory.connect(deployer),
        [
          trackedToken.address,
          collateralToken,
          borrower.address,
          fee,
          collateralTokenId,
          collateralAmount,
          loanAmount,
          offerDuration,
        ],
      )

      expect(royaltyLoan.address).to.properAddress
    })
  })

  describe('provide loan', () => {
    it('successfully provide loan', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      const provideLoanTx = loan.connect(lender).provideLoan()

      await getEvent(provideLoanTx, template, 'LoanProvided')

      const borrowerBalanceAfterLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceAfterLoan.toString()).to.equal(
        loanAmount.toString(),
      )
    })

    it('successfully provide loan then throws as cannot provide loan twice', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      const provideLoanTx = loan.connect(lender).provideLoan()

      await getEvent(provideLoanTx, template, 'LoanProvided')

      const borrowerBalanceAfterLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceAfterLoan.toString()).to.equal(
        loanAmount.toString(),
      )

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'Loan is already provided',
      )
    })

    it('throws as loan is not active', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      const revokeLoanTx = await loan.connect(borrower).revokeLoan()
      await revokeLoanTx.wait()
      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'Loan offer is revoked',
      )
    })

    it('throws as lender does not have allowance set to provide loan', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'ERC20: insufficient allowance',
      )
    })

    it('throws as loan expired', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()
      // increses block time to simulate loan expiration
      await time.increase(offerDuration + 1)

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'Loan offer expired',
      )
    })

    it('throws as collateral not transfered', async () => {
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

      const collateralAmount = 400
      const loanAmount = 3
      const collateralTokenId = 1
      const royaltyLoanFactory = new RoyaltyLoan__factory()

      const loan = await deployProxy(royaltyLoanFactory.connect(deployer), [
        trackedToken.address,
        agreement.address,
        borrower.address,
        fee,
        collateralTokenId,
        collateralAmount,
        loanAmount,
        offerDuration,
      ])

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'Collateral was not transferred in the required amount',
      )
    })

    it('throws as not balance to provide loan', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.utils.parseUnits('3', 6)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lenderWithoutTrackedTokens)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      await expect(
        loan.connect(lenderWithoutTrackedTokens).provideLoan(),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('throws as loan is not active', async () => {
      const loanAmount = ethers.utils.parseUnits('3', 6)
      const loanFactory = new RoyaltyLoan__factory()
      const loan = await loanFactory.connect(deployer).deploy()

      const approveTx = await trackedToken
        .connect(lenderWithoutTrackedTokens)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      await expect(loan.connect(lender).provideLoan()).to.be.revertedWith(
        'Loan offer is revoked',
      )
    })
  })

  describe('processRepayment', () => {
    it('sucesfull full repayment', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.utils.parseUnits('3', 6)

      const loan = await provideLoan(
        collateralAmount,
        loanAmount,
        borrower,
        lender,
        agreement,
        factory,
        trackedToken,
      )
      const borrowerBalance = await trackedToken.balanceOf(borrower.address)
      expect(borrowerBalance.toString()).to.equal(loanAmount.toString())

      const mintTx = await trackedToken.mintTo(borrower.address, fee)
      await mintTx.wait()
      const loanRepaymentValue = loanAmount.add(fee)

      // repay loan
      const transferTx = await trackedToken
        .connect(borrower)
        .transfer(loan.address, loanRepaymentValue)
      await transferTx.wait()

      const loanTrackedTokenBalanceBeforeRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceBeforeRepayment.toString()).to.equal(
        loanRepaymentValue.toString(),
      )

      const loanAgreementBalanceBeforeRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceBeforeRepayment.toString()).to.equal(
        collateralAmount.toString(),
      )

      const lenderBalance = await trackedToken.balanceOf(lender.address)

      // processes repayment
      await loan.connect(borrower).processRepayment()

      const loanAgreementBalanceAfterRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceAfterRepayment.toString()).to.equal('0')

      const loanTrackedTokenBalanceAfterRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceAfterRepayment.toString()).to.equal('0')

      const lenderBalanceAfterRepayment = await trackedToken.balanceOf(
        lender.address,
      )
      expect(lenderBalanceAfterRepayment.toString()).to.equal(
        lenderBalance.add(loanAmount).add(fee).toString(),
      )

      const borrowerBalanceAfterRepayment = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceAfterRepayment.toString()).to.equal('0')

      const borrowerAgreementBalanceAfterRepayment = await agreement.balanceOf(
        borrower.address,
        1,
      )
      expect(borrowerAgreementBalanceAfterRepayment.toString()).to.equal('600')
    })

    it('sucesfull full repayment with exceeded balance', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.utils.parseUnits('3', 6)
      const exceededAmount = ethers.utils.parseUnits('1', 6)

      const loan = await provideLoan(
        collateralAmount,
        loanAmount,
        borrower,
        lender,
        agreement,
        factory,
        trackedToken,
      )
      const borrowerBalance = await trackedToken.balanceOf(borrower.address)
      expect(borrowerBalance.toString()).to.equal(loanAmount.toString())

      const mintTx = await trackedToken.mintTo(
        borrower.address,
        fee.add(exceededAmount),
      )
      await mintTx.wait()
      const loanRepaymentValue = loanAmount.add(fee).add(exceededAmount)

      // repay loan
      const transferTx = await trackedToken
        .connect(borrower)
        .transfer(loan.address, loanRepaymentValue)
      await transferTx.wait()

      const loanTrackedTokenBalanceBeforeRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceBeforeRepayment.toString()).to.equal(
        loanRepaymentValue.toString(),
      )

      const loanAgreementBalanceBeforeRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceBeforeRepayment.toString()).to.equal(
        collateralAmount.toString(),
      )

      const lenderBalance = await trackedToken.balanceOf(lender.address)

      // processes repayment
      await loan.connect(borrower).processRepayment()

      const loanAgreementBalanceAfterRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceAfterRepayment.toString()).to.equal('0')

      const loanTrackedTokenBalanceAfterRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceAfterRepayment.toString()).to.equal('0')

      const lenderBalanceAfterRepayment = await trackedToken.balanceOf(
        lender.address,
      )
      expect(lenderBalanceAfterRepayment.toString()).to.equal(
        lenderBalance.add(loanAmount).add(fee).toString(),
      )

      const borrowerAgreementBalanceAfterRepayment = await agreement.balanceOf(
        borrower.address,
        1,
      )
      expect(borrowerAgreementBalanceAfterRepayment.toString()).to.equal('600')

      const borrowerBalanceAfterRepayment = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceAfterRepayment.toString()).to.equal(exceededAmount)
    })

    it('sucesfull partial then full repayment', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.utils.parseUnits('3', 6)
      const partialRepaymentAmount = ethers.utils.parseUnits('2', 6)

      const loan = await provideLoan(
        collateralAmount,
        loanAmount,
        borrower,
        lender,
        agreement,
        factory,
        trackedToken,
      )
      const borrowerBalance = await trackedToken.balanceOf(borrower.address)
      expect(borrowerBalance.toString()).to.equal(loanAmount.toString())

      const mintTx = await trackedToken.mintTo(borrower.address, fee)
      await mintTx.wait()

      // repay loan
      const transferPartialTx = await trackedToken
        .connect(borrower)
        .transfer(loan.address, partialRepaymentAmount)
      await transferPartialTx.wait()

      // const loanRepaymentValue = loanAmount.add(fee)
      const loanTrackedTokenBalanceBeforeRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceBeforeRepayment.toString()).to.equal(
        partialRepaymentAmount.toString(),
      )

      const loanAgreementBalanceBeforeRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceBeforeRepayment.toString()).to.equal(
        collateralAmount.toString(),
      )

      const lenderBalance = await trackedToken.balanceOf(lender.address)

      // processes partial repayment
      await loan.connect(borrower).processRepayment()

      const loanAgreementBalanceAfterPartialRepayment =
        await agreement.balanceOf(loan.address, 1)
      expect(loanAgreementBalanceAfterPartialRepayment.toString()).to.equal(
        collateralAmount.toString(),
      )

      const loanTrackedTokenBalanceAfterPartialRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceAfterPartialRepayment.toString()).to.equal(
        '0',
      )

      const loanAmountAfterPartialRepayment = await loan.loanAmount()
      expect(loanAmountAfterPartialRepayment).to.equal(
        loanAmount.sub(partialRepaymentAmount),
      )

      const lenderBalanceAfterPartialRepayment = await trackedToken.balanceOf(
        lender.address,
      )
      expect(lenderBalanceAfterPartialRepayment.toString()).to.equal(
        lenderBalance.add(partialRepaymentAmount),
      )

      const borrowerAgreementBalanceAfterPartialRepayment =
        await agreement.balanceOf(borrower.address, 1)
      expect(borrowerAgreementBalanceAfterPartialRepayment.toString()).to.equal(
        '200',
      )

      // processes full repayment

      const loanRepaymentValue = loanAmount.add(fee).sub(partialRepaymentAmount)

      // repay loan
      const transferTx = await trackedToken
        .connect(borrower)
        .transfer(loan.address, loanRepaymentValue)
      await transferTx.wait()

      await loan.connect(borrower).processRepayment()

      const loanAgreementBalanceAfterRepayment = await agreement.balanceOf(
        loan.address,
        1,
      )
      expect(loanAgreementBalanceAfterRepayment.toString()).to.equal('0')

      const loanTrackedTokenBalanceAfterRepayment =
        await trackedToken.balanceOf(loan.address)
      expect(loanTrackedTokenBalanceAfterRepayment.toString()).to.equal('0')

      const lenderBalanceAfterRepayment = await trackedToken.balanceOf(
        lender.address,
      )
      expect(lenderBalanceAfterRepayment.toString()).to.equal(
        lenderBalance.add(loanAmount).add(fee).toString(),
      )

      const borrowerAgreementBalanceAfterRepayment = await agreement.balanceOf(
        borrower.address,
        1,
      )
      expect(borrowerAgreementBalanceAfterRepayment.toString()).to.equal('600')

      const borrowerBalanceAfterRepayment = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceAfterRepayment.toString()).to.equal('0')
    })

    it('throws as loan is not provided', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('Loan is not provided')
    })

    it('throws as no USDC to process', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.utils.parseUnits('3', 6)

      const loan = await provideLoan(
        collateralAmount,
        loanAmount,
        borrower,
        lender,
        agreement,
        factory,
        trackedToken,
      )

      // processes repayment
      await expect(
        loan.connect(borrower).processRepayment(),
      ).to.be.revertedWith('No USDC to process')
    })
  })

  describe('revokeLoan', () => {
    it('successfully revoke loan', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const isLoanActive = await loan.loanOfferActive()
      expect(isLoanActive).to.equal(true)

      const revokeTx = await loan.connect(borrower).revokeLoan()
      await revokeTx.wait()

      const isLoanActiveAfterTx = await loan.loanOfferActive()
      expect(isLoanActiveAfterTx).to.equal(false)
    })

    it('throws as msg sender is not borrower', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const isLoanActive = await loan.loanOfferActive()
      expect(isLoanActive).to.equal(true)

      await expect(loan.connect(lender).revokeLoan()).to.be.revertedWith(
        'Only borrower can revoke the loan',
      )
    })

    it('throws as cannot revoke twice', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const isLoanActive = await loan.loanOfferActive()
      expect(isLoanActive).to.equal(true)

      const revokeTx = await loan.connect(borrower).revokeLoan()
      await revokeTx.wait()

      const isLoanActiveAfterTx = await loan.loanOfferActive()
      expect(isLoanActiveAfterTx).to.equal(false)

      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'Loan offer is revoked',
      )
    })

    it('throws as loan is provided', async () => {
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

      const collateralAmount = ethers.BigNumber.from(400)
      const loanAmount = ethers.BigNumber.from(3)

      const loan = await createLoan(
        agreement,
        collateralAmount,
        loanAmount,
        factory,
        borrower,
      )

      const borrowerBalanceBeforeLoan = await trackedToken.balanceOf(
        borrower.address,
      )
      expect(borrowerBalanceBeforeLoan.toString()).to.equal('0')

      const approveTx = await trackedToken
        .connect(lender)
        .approve(loan.address, loanAmount)
      await approveTx.wait()

      const provideLoanTx = await loan.connect(lender).provideLoan()
      await provideLoanTx.wait()

      await expect(loan.connect(borrower).revokeLoan()).to.be.revertedWith(
        'Loan is already provided',
      )
    })
  })
})
