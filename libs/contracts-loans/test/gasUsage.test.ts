import { AgreementERC1155, ERC20TokenMock } from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fixture } from './fixture';

describe.skip('RoyaltyLoan - gas usage', () => {
  let deployer: SignerWithAddress;
  let borrower: SignerWithAddress;
  let lender: SignerWithAddress;

  let paymentToken: ERC20TokenMock;
  let defaults: Awaited<ReturnType<typeof fixture>>['defaults'];
  let createLoan: Awaited<ReturnType<typeof fixture>>['createLoan'];

  let deployAgreementERC1155: Awaited<
    ReturnType<typeof fixture>
  >['deployAgreementERC1155'];

  let runSimulation: (
    collateralsCt: number,
    unclaimedExcessOnAgreement?: bigint,
    log?: boolean,
  ) => Promise<void>;

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
      unclaimedExcessOnAgreement = 0n,
      log = true,
    ) => {
      const collaterals: AgreementERC1155[] = [];
      const collateralAmount = 10_000n;

      for (let i = 0; i < collateralsCt; i++) {
        const collateral = await deployAgreementERC1155([
          {
            account: borrower.address,
            balance: collateralAmount,
            isAdmin: true,
          },
        ]);

        collaterals.push(collateral);
      }

      const mappedColalterals = collaterals.map((col) => ({
        collateralToken: col,
        collateralAmount,
      }));

      const loan = await createLoan.standard(borrower, mappedColalterals);

      await (await loan.connect(lender).provideLoan()).wait();

      await (
        await paymentToken.mintTo(
          await loan.getAddress(),
          defaults.loanAmount + defaults.feeAmount,
        )
      ).wait();

      for (const coll of collaterals) {
        if (unclaimedExcessOnAgreement > 0n) {
          await (
            await paymentToken.mintTo(
              await coll.getAddress(),
              unclaimedExcessOnAgreement,
            )
          ).wait();
        }
      }

      try {
        const receipt = await (await loan.processRepayment()).wait();
        const gasUsed = receipt!.gasUsed;
        if (log) {
          console.log('Collaterals: ', collateralsCt);
          console.log('Total gas used: ', gasUsed.toLocaleString());
          console.log(
            'Gas per collateral: ',
            (gasUsed / BigInt(collateralsCt)).toLocaleString(),
          );

          console.log(
            `Consumed ${gasUsed.toLocaleString()}/30,000,000 (${Number((gasUsed * 100n) / 30000000n).toFixed(2)}%)`,
          );
          console.log('------------------------------------');
        }
      } catch (err) {
        console.log('siemka');
        if (log) {
          console.log('OUT OF GAS');
          console.log(`PARAMS: collaterals: ${collateralsCt}`);
          console.log(err);
        }
        throw new Error(err as any);
      }
    };
  });

  it('edge parameters detection', async () => {
    let keepRunning = true;
    let collateralsCt = 1;
    const log = true;

    while (keepRunning) {
      try {
        await runSimulation(collateralsCt, 500n * 10n ** 6n, log);
        collateralsCt++;
      } catch (e) {
        console.log(e);
        keepRunning = false;
      }
    }
  }).timeout(10000000000000000);
});
