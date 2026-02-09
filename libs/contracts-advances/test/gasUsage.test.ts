import {
  AgreementERC1155,
  ERC20TokenMock,
  RoyaltyAdvance,
  RoyaltyAdvanceFactory,
} from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from './fixture';

const log = true;
interface RunSimulationParams {
  unclaimedExcessOnAgreement?: boolean;
  unclaimedExcessOnAgreementBeforeInit?: boolean;
  excessOnAdvance?: boolean;
  log?: boolean;
}

type RunSimulationFailReason = 'createAdvance' | 'processRepayment';

interface RunSimulationResult {
  success: boolean;
  reason?: RunSimulationFailReason;
}

describe.skip('RoyaltyAdvance - gas usage', () => {
  let deployer: SignerWithAddress;
  let recipient: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let advanceFactory: RoyaltyAdvanceFactory;
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let createAdvance: Awaited<ReturnType<typeof fixture>>['createAdvance'];

  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  let runSimulation: (
    collateralsCt: number,
    params?: RunSimulationParams,
  ) => Promise<RunSimulationResult>;

  beforeEach(async () => {
    const deployment = await fixture();

    [deployer, lender, recipient] = deployment.signers;
    ({
      paymentToken,
      createAdvance,
      deployAgreementERC1155,
      defaults,
      advanceFactory,
    } = deployment);
    await (
      await paymentToken.mintTo(
        lender.address,
        deployment.defaults.advanceAmount,
      )
    ).wait();

    runSimulation = async (
      collateralsCt: number,
      params?: RunSimulationParams,
    ) => {
      const excessOnAdvance = !!params?.excessOnAdvance;
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
            account: recipient.address,
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

      let advance: RoyaltyAdvance | undefined;

      try {
        const blockNumber = await deployer.provider.getBlockNumber();

        advance = await createAdvance.standard(recipient, mappedColalterals);

        if (log) {
          const events = await advanceFactory.queryFilter(
            advanceFactory.getEvent('AdvanceContractCreated'),
            blockNumber,
          );
          const advanceAddress = (await advance!.getAddress()).toLowerCase();
          const event = events.find(
            (e) => e.args.advanceContract.toLowerCase() === advanceAddress,
          );
          const receipt = await event?.getTransactionReceipt();
          const gasUsed = receipt!.gasUsed;

          console.log(
            `CreateAdvance:       ${gasUsed.toLocaleString()}/30,000,000 (${Number((gasUsed * 100n) / 30000000n).toFixed(2)}%)`,
          );
        }
      } catch {
        if (log) {
          console.log('** Revert on createAdvance **');
        }
        return {
          success: false,
          reason: 'createAdvance',
        };
      }

      if (!advance) {
        throw new Error('Advance not created');
      }

      await (await advance.connect(lender).provideAdvance()).wait();

      await (
        await paymentToken.mintTo(
          await advance.getAddress(),
          defaults.advanceAmount +
            defaults.feeAmount +
            (excessOnAdvance ? excess : 0n),
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
        const receipt = await (await advance.processRepayment()).wait();
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
          excessOnAdvance: true,
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
// CreateAdvance:       26,360,391/30,000,000 (87.00%)
// ProcessRepayment: 18,139,239/30,000,000 (60.00%)
// ===============================================
// ** Collaterals:   110
// ** Revert on createAdvance **

// (unclaimedExcessOnAgreementBeforeInit: true)
// ** Collaterals:   79
// CreateAdvance:       26,791,377/30,000,000 (89.00%)
// ProcessRepayment: 13,185,177/30,000,000 (43.00%)
// ===============================================
// ** Collaterals:   80
// ** Revert on createAdvance **

// (unclaimedExcessOnAgreement: true)
// ** Collaterals:   96
// CreateAdvance:       23,263,923/30,000,000 (77.00%)
// ProcessRepayment: 26,028,902/30,000,000 (86.00%)
// ===============================================
// ** Collaterals:   97
// CreateAdvance:       23,502,189/30,000,000 (78.00%)
// ** Revert on processRepayment **

// (excessOnAdvance: true)
// ** Collaterals:   109
// CreateAdvance:       26,360,391/30,000,000 (87.00%)
// ProcessRepayment: 18,148,655/30,000,000 (60.00%)
// ===============================================
// ** Collaterals:   110
// ** Revert on createAdvance **
