import { expect } from 'chai';
import { parseEther, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import {
  deployAgreementERC1155,
  deployAgreementERC20,
  deployInitialSetup,
} from '../../helpers/deployments';

describe('AgreementERC1155.safeTransferFrom', () => {
  const TOKEN_ID = 1n;
  it('can transfer to a holder', async () => {
    const initialSetup = await deployInitialSetup();

    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [500, 500],
    });
    const holder1 = holders[0];
    const holder2 = holders[1];

    await agreement
      .connect(holder1.wallet)
      .safeTransferFrom(
        holder1.account,
        holder2.account,
        TOKEN_ID,
        300n,
        '0x00',
      );

    expect(await agreement.balanceOf(holder1.account, TOKEN_ID)).to.equal(200n);
    expect(await agreement.balanceOf(holder2.account, TOKEN_ID)).to.equal(800n);
  });

  it('can transfer to a non-holder', async () => {
    const initialSetup = await deployInitialSetup();

    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [1000n],
    });
    const holder = holders[0];
    const nonHolder = Wallet.createRandom().address;

    await agreement
      .connect(holder.wallet)
      .safeTransferFrom(holder.account, nonHolder, TOKEN_ID, 300n, '0x00');

    expect(await agreement.balanceOf(holder.account, TOKEN_ID)).to.equal(700n);
    expect(await agreement.balanceOf(nonHolder, TOKEN_ID)).to.equal(300n);
  });

  it('can transfer shares to agreementERC1155', async () => {
    const initialSetup = await deployInitialSetup();

    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [1000n],
    });
    const holder = holders[0];
    const { agreement: agreement2 } = await deployAgreementERC1155({
      initialSetup,
      shares: [1000n],
    });

    await agreement
      .connect(holder.wallet)
      .safeTransferFrom(
        holder.account,
        await agreement2.getAddress(),
        TOKEN_ID,
        300n,
        '0x00',
      );

    expect(await agreement.balanceOf(holder.account, TOKEN_ID)).to.equal(700n);
    expect(
      await agreement.balanceOf(await agreement2.getAddress(), TOKEN_ID),
    ).to.equal(300n);
  });

  it('can transfer shares to agreementERC20', async () => {
    const initialSetup = await deployInitialSetup();

    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [1000n],
    });
    const holder = holders[0];
    const { agreement: agreement2 } = await deployAgreementERC20({
      initialSetup,
      shares: [1000n],
    });

    await agreement
      .connect(holder.wallet)
      .safeTransferFrom(
        holder.account,
        await agreement2.getAddress(),
        TOKEN_ID,
        300n,
        '0x00',
      );

    expect(await agreement.balanceOf(holder.account, TOKEN_ID)).to.equal(700n);
    expect(
      await agreement.balanceOf(await agreement2.getAddress(), TOKEN_ID),
    ).to.equal(300n);
  });

  it('claims funds for sender and receiver before transfer', async () => {
    const initialSetup = await deployInitialSetup({
      paymentFee: parseEther('0'),
    });
    const { lendingToken } = initialSetup;
    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [600n, 400n],
    });
    const sender = holders[0];
    const receiver = holders[1];

    expect(await lendingToken.balanceOf(sender.account)).to.equal(0n);
    expect(await lendingToken.balanceOf(receiver.account)).to.equal(0n);

    await lendingToken.transfer(await agreement.getAddress(), 1000n);
    await agreement
      .connect(sender.wallet)
      .safeTransferFrom(
        sender.account,
        receiver.account,
        TOKEN_ID,
        500n,
        '0x00',
      );

    expect(await agreement.balanceOf(sender.account, TOKEN_ID)).to.equal(100n);
    expect(await agreement.balanceOf(receiver.account, TOKEN_ID)).to.equal(
      900n,
    );

    expect(await lendingToken.balanceOf(sender.account)).to.equal(600n);
    expect(await lendingToken.balanceOf(receiver.account)).to.equal(400n);
  });

  it('does not affect third party holder in any matter', async () => {
    const initialSetup = await deployInitialSetup({
      paymentFee: parseEther('0'),
    });
    const { lendingToken } = initialSetup;
    const { agreement, holders } = await deployAgreementERC1155({
      initialSetup,
      shares: [600n, 400n],
    });
    const sender = holders[0];
    const [, , , , , receiver] = await ethers.getSigners();
    const thirdPartyHolder = holders[1];

    await lendingToken.transfer(await agreement.getAddress(), 1000n);
    await agreement
      .connect(sender.wallet)
      .safeTransferFrom(
        sender.account,
        receiver.address,
        TOKEN_ID,
        100n,
        '0x00',
      );

    expect(await lendingToken.balanceOf(sender.account)).to.equal(600n); // Received 60% of 1000 Tokens
    expect(await lendingToken.balanceOf(thirdPartyHolder.account)).to.equal(0n); // No action performed
    expect(await lendingToken.balanceOf(receiver.address)).to.equal(0n); // Received 0% of 100 Tokens

    await lendingToken.transfer(await agreement.getAddress(), 2000n);
    await agreement
      .connect(sender.wallet)
      .safeTransferFrom(
        sender.account,
        receiver.address,
        TOKEN_ID,
        100n,
        '0x00',
      );
    // Received 50% of 2000 Tokens (600 + 1000 Tokens)
    expect(await lendingToken.balanceOf(sender.account)).to.equal(1600n);

    // No action performed
    expect(await lendingToken.balanceOf(thirdPartyHolder.account)).to.equal(0n);

    // Received 10% of 2000 Tokens (0 + 200 Tokens)
    expect(await lendingToken.balanceOf(receiver.address)).to.equal(200n);

    await lendingToken.transfer(await agreement.getAddress(), 3000n);
    await agreement.claimHolderFunds(
      sender.account,
      await lendingToken.getAddress(),
    );
    await agreement.claimHolderFunds(
      thirdPartyHolder.account,
      await lendingToken.getAddress(),
    );
    await agreement.claimHolderFunds(
      receiver.address,
      await lendingToken.getAddress(),
    );

    // Received 40% of 3000 Tokens (1600 + 1200 Tokens)
    expect(await lendingToken.balanceOf(sender.account)).to.equal(2800n);

    // Received 40% of 6000 Tokens
    expect(await lendingToken.balanceOf(thirdPartyHolder.account)).to.equal(
      2400n,
    );

    // Received 20% of 3000 Tokens (200 + 600 Tokens)
    expect(await lendingToken.balanceOf(receiver.address)).to.equal(800n);
  });
});
