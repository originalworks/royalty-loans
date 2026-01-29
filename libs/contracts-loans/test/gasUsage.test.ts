import {
  AgreementERC1155,
  ERC20TokenMock,
  RoyaltyLoan,
  RoyaltyLoanFactory,
} from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from './fixture';

const log = true;
interface RunSimulationParams {
  unclaimedExcessOnAgreement?: boolean;
  unclaimedExcessOnAgreementBeforeInit?: boolean;
  excessOnLoan?: boolean;
  log?: boolean;
}

type RunSimulationFailReason = 'createLoan' | 'processRepayment';

interface RunSimulationResult {
  success: boolean;
  reason?: RunSimulationFailReason;
}

describe.skip('RoyaltyLoan - gas usage', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let loanFactory: RoyaltyLoanFactory;
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let createLoan: Awaited<ReturnType<typeof fixture>>['createLoan'];

  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  let runSimulation: (
    collateralsCt: number,
    params?: RunSimulationParams,
  ) => Promise<RunSimulationResult>;

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, lender, borrower] = deployment.signers;
    ({
      paymentToken,
      createLoan,
      deployAgreementERC1155,
      defaults,
      loanFactory,
    } = deployment);
    await (
      await paymentToken.mintTo(lender.address, deployment.defaults.loanAmount)
    ).wait();

    runSimulation = async (
      collateralsCt: number,
      params?: RunSimulationParams,
    ) => {
      const excessOnLoan = !!params?.excessOnLoan;
      const unclaimedExcessOnAgreement = !!params?.unclaimedExcessOnAgreement;
      const unclaimedExcessOnAgreementBeforeInit =
        !!params?.unclaimedExcessOnAgreementBeforeInit;
      const log = !!params?.log;

      const collaterals: AgreementERC1155[] = [];
      const collateralAmount = 10_000n;
      const excess = 10_000n;

      if (log) {
        console.log(`** Collaterals:   ${collateralsCt}`);
      }

      for (let i = 0; i < collateralsCt; i++) {
        const collateral = await deployAgreementERC1155([
          {
            account: borrower.address,
            balance: collateralAmount,
            isAdmin: true,
          },
        ]);

        if (unclaimedExcessOnAgreementBeforeInit) {
          await (
            await paymentToken.mintTo(await collateral.getAddress(), excess)
          ).wait();
        }

        collaterals.push(collateral);
      }

      const mappedColalterals = collaterals.map((col) => ({
        collateralToken: col,
        collateralAmount,
      }));

      let loan: RoyaltyLoan | undefined;

      try {
        const blockNumber = await deployer.provider.getBlockNumber();

        loan = await createLoan.standard(borrower, mappedColalterals);

        if (log) {
          const events = await loanFactory.queryFilter(
            loanFactory.getEvent('LoanContractCreated'),
            blockNumber,
          );
          const loanAddress = (await loan!.getAddress()).toLowerCase();
          const event = events.find(
            (e) => e.args.loanContract.toLowerCase() === loanAddress,
          );
          const receipt = await event?.getTransactionReceipt();
          const gasUsed = receipt!.gasUsed;

          console.log(
            `CreateLoan:       ${gasUsed.toLocaleString()}/30,000,000 (${Number((gasUsed * 100n) / 30000000n).toFixed(2)}%)`,
          );
        }
      } catch {
        if (log) {
          console.log('** Revert on createLoan **');
        }
        return {
          success: false,
          reason: 'createLoan',
        };
      }

      if (!loan) {
        throw new Error('Loan not created');
      }

      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount +
            defaults.feeAmount +
            (excessOnLoan ? excess : 0n),
        )
      ).wait();

      if (unclaimedExcessOnAgreement) {
        for (const coll of collaterals) {
          await (
            await paymentToken.mintTo(await coll.getAddress(), excess)
          ).wait();
        }
      }

      try {
        const receipt = await (await loan.processRepayment()).wait();
        const gasUsed = receipt!.gasUsed;
        if (log) {
          console.log(
            `ProcessRepayment: ${gasUsed.toLocaleString()}/30,000,000 (${Number((gasUsed * 100n) / 30000000n).toFixed(2)}%)`,
          );
          console.log('===============================================');
        }
      } catch (err) {
        if (log) {
          console.log('** Revert on processRepayment **');
        }
        return {
          success: false,
          reason: 'processRepayment',
        };
      }

      return {
        success: true,
      };
    };
  });

  it('edge parameters detection playground', async () => {
    let keepRunning = true;
    let collateralsCt = 1;

    while (keepRunning) {
      try {
        const { success, reason } = await runSimulation(collateralsCt, {
          log,
          excessOnLoan: true,
        });
        if (!success) {
          throw new Error(reason);
        }
        collateralsCt++;
      } catch (e) {
        console.log(e);
        keepRunning = false;
      }
    }
  }).timeout(10000000000000000);
});

// (no params)
// ** Collaterals:   109
// CreateLoan:       26,360,391/30,000,000 (87.00%)
// ProcessRepayment: 18,139,239/30,000,000 (60.00%)
// ===============================================
// ** Collaterals:   110
// ** Revert on createLoan **

// (unclaimedExcessOnAgreementBeforeInit: true)
// ** Collaterals:   79
// CreateLoan:       26,791,377/30,000,000 (89.00%)
// ProcessRepayment: 13,185,177/30,000,000 (43.00%)
// ===============================================
// ** Collaterals:   80
// ** Revert on createLoan **

// (unclaimedExcessOnAgreement: true)
// ** Collaterals:   96
// CreateLoan:       23,263,923/30,000,000 (77.00%)
// ProcessRepayment: 26,028,902/30,000,000 (86.00%)
// ===============================================
// ** Collaterals:   97
// CreateLoan:       23,502,189/30,000,000 (78.00%)
// ** Revert on processRepayment **

// (excessOnLoan: true)
// ** Collaterals:   109
// CreateLoan:       26,360,391/30,000,000 (87.00%)
// ProcessRepayment: 18,148,655/30,000,000 (60.00%)
// ===============================================
// ** Collaterals:   110
// ** Revert on createLoan **
