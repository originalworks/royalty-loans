import { ethers } from 'hardhat';
import { AgreementERC1155, ERC20TokenMock } from '../../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from '../fixture';
import { ICollateral } from '../../typechain/contracts/Loans/interfaces/IBeneficiaryRoyaltyLoan';
import { HDNodeWallet } from 'ethers';
import { createManyWallets } from '../utils';

let expect: Chai.ExpectStatic;

const splitPpmEqually = (count: number): bigint[] => {
  if (count <= 0) {
    throw new Error('count must be > 0');
  }

  const base = 1_000_000n / BigInt(count);
  let remainder = 1_000_000n;

  const ppms: bigint[] = [];

  for (let i = 0; i < count; i++) {
    const ppm = i === count - 1 ? remainder : base;
    ppms.push(ppm);
    remainder -= ppm;
  }

  return ppms;
};

type LogLevel = 'csv' | 'console' | 'none';

describe('BeneficiaryRoyaltyLoan - gas usage', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let createLoan: Awaited<ReturnType<typeof fixture>>['createLoan'];

  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  let wallets: HDNodeWallet[];
  let runSimulation: (
    collateralsCt: number,
    beneficiariesCt: number,
    collateralAmount?: bigint | 'auto',
    excessPaymentToken?: bigint,
    log?: LogLevel,
  ) => Promise<void>;

  before(async () => {
    expect = (await import('chai')).expect;
    wallets = createManyWallets();
  });

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, lender, borrower] = deployment.signers;
    ({ paymentToken, createLoan, deployAgreementERC1155, defaults } =
      deployment);
    await (
      await paymentToken.mintTo(lender.address, deployment.defaults.loanAmount)
    ).wait();

    runSimulation = async (
      collateralsCt: number,
      beneficiariesCt: number,
      collateralAmount = 'auto',
      excessPaymentToken = 0n,
      log = 'console',
    ) => {
      const autoCollateralAmount = collateralAmount === 'auto';
      const collaterals: AgreementERC1155[] = [];
      const beneficiaries: ICollateral.BeneficiaryStruct[] = [];
      const beneficiarySplits = splitPpmEqually(beneficiariesCt);

      for (let i = 0; i < beneficiariesCt; i++) {
        beneficiaries.push({
          beneficiaryAddress: wallets[i].address,
          ppm: beneficiarySplits[i],
        });
      }

      for (let i = 0; i < collateralsCt; i++) {
        const collateral = await deployAgreementERC1155([
          {
            account: borrower.address,
            balance: autoCollateralAmount ? BigInt(beneficiariesCt) : 10_000n,
            isAdmin: true,
          },
        ]);
        collaterals.push(collateral);
      }

      const collateralsWithBeneficiaries = [];

      for (const coll of collaterals) {
        collateralsWithBeneficiaries.push({
          collateralToken: coll,
          collateralAmount: autoCollateralAmount
            ? BigInt(beneficiariesCt)
            : collateralAmount,
          beneficiaries,
        });
      }

      const loan = await createLoan.beneficiary(
        borrower,
        collateralsWithBeneficiaries,
      );

      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount + excessPaymentToken,
        )
      ).wait();
      try {
        const receipt = await (await loan.processRepayment()).wait();
        const gasUsed = receipt!.gasUsed;
        if (log === 'console') {
          console.log('Collaterals: ', collateralsCt);
          console.log('Beneficiaries: ', beneficiariesCt);
          if (!autoCollateralAmount) {
            console.log(
              'Collateral Amount: ',
              collateralAmount.toLocaleString(),
            );
          }
          console.log('Total gas used: ', gasUsed.toLocaleString());
          console.log(
            'Gas per beneficiary: ',
            (
              gasUsed /
              BigInt(collateralsCt) /
              BigInt(beneficiariesCt)
            ).toLocaleString(),
          );

          console.log(
            `Consumed ${gasUsed.toLocaleString()}/30,000,000 (${Number((gasUsed * 100n) / 30000000n).toFixed(2)}%)`,
          );
          console.log('------------------------------------');
        }
        if (log === 'csv') {
          console.log(
            [
              collateralsCt,
              beneficiariesCt,
              gasUsed.toString(),
              Number((gasUsed * 100n) / 30000000n).toFixed(2),
            ].join(';'),
          );
        }
      } catch (err) {
        if (log === 'console') {
          console.log('OUT OF GAS');
          console.log(
            `PARAMS: collaterals: ${collateralsCt}, beneficiaries ${beneficiariesCt}, collateralAmount ${collateralAmount}`,
          );
        }
        throw new Error(err as any);
      }
    };
  });

  it.only('edge parameters detection', async () => {
    let keepRunning = true;
    let collateralsCt = 1;
    let beneficiariesCt = 1;
    let consecutiveErrorsCt = 0;
    const logLevel: LogLevel = 'csv';
    const params: { collateralsCt: number; beneficiariesCt: number }[] = [];

    if (logLevel === ('csv' as LogLevel)) {
      console.log('CollateralsCt;BeneficiariesCt;Gas Used;Tx Size %');
    }

    while (keepRunning) {
      try {
        await runSimulation(
          collateralsCt,
          beneficiariesCt,
          1000n,
          500n * 10n ** 6n,
          'csv',
        );
        beneficiariesCt++;
        consecutiveErrorsCt = 0;
      } catch {
        if (logLevel === ('console' as LogLevel)) {
          console.log(
            `Simulation failed for ${collateralsCt} collaterals, ${beneficiariesCt} beneficiaries each`,
          );
        }
        params.push({ collateralsCt, beneficiariesCt: beneficiariesCt - 1 });
        collateralsCt++;
        beneficiariesCt = 1;
        consecutiveErrorsCt++;
      }
      if (consecutiveErrorsCt > 1) {
        if (logLevel === ('console' as LogLevel)) {
          console.log('Simulation done');
        }
        keepRunning = false;
      }
    }
    if (logLevel === ('console' as LogLevel)) {
      console.log(JSON.stringify(params, null, 2));
    }
  }).timeout(10000000000000000);

  it('sweep tests', async () => {
    const USDC = 10n ** 6n;
    const collateralSweeps = [1, 3, 5, 10, 100];
    const beneficiarySweeps = [1, 4, 10, 20, 25, 44, 50, 100];
    const collateralAmountSweeps = [1n, 10n, 100n, 1000n, 10_000n];
    const excessPaymentTokenSweeps = [
      0n,
      USDC,
      3n * USDC,
      100n * USDC,
      9999n * USDC,
    ];

    for (const collateralsCt of collateralSweeps) {
      for (const beneficiariesCt of beneficiarySweeps) {
        for (const collateralAmount of collateralAmountSweeps) {
          for (const excessPaymentToken of excessPaymentTokenSweeps) {
            await runSimulation(
              collateralsCt,
              beneficiariesCt,
              collateralAmount,
              excessPaymentToken,
            );
          }
        }
      }
    }
  }).timeout(10000000000000000);

  // collateralAmount == beneficiaries
  // AND
  // (1_000_000 % beneficiaries == 0)
  // ex spikes: [1, 2, 4, 5, 8, 10, 16, 20, 25, 32, 40, 50, 64, 80, 100]
});
