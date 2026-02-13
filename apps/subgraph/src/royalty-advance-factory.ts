import { BigInt } from '@graphprotocol/graph-ts';

import {
  AdvanceContract,
  AdvanceContractCollateral,
} from '../generated/schema';
import { RoyaltyAdvance } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  AdvanceContractCreated as AdvanceContractCreatedEvent,
} from '../generated/RoyaltyAdvanceFactory/RoyaltyAdvanceFactory';
import { createExpense } from './expense';
import { initializeStats, recordStats } from './helpers';

export function handleInitialized(event: InitializedEvent): void {
  initializeStats();
}

export function handleAdvanceContractCreated(
  event: AdvanceContractCreatedEvent,
): void {
  const collaterals = event.params.collaterals;

  const entity = new AdvanceContract(event.params.advanceContract);
  entity.advanceContract = event.params.advanceContract;
  entity.recipient = event.params.advanceContract;
  entity.collateralReceiver = event.params.advanceContract;
  entity.isPackAdvance = collaterals.length > 1;
  entity.advanceAmount = event.params.advanceAmount;
  entity.recoupmentAmount = event.params.advanceAmount.plus(
    event.params.advanceAmount
      .times(event.params.feePpm)
      .div(BigInt.fromI32(1000000)),
  );
  entity.repaidAmount = BigInt.zero();
  entity.actualRepaid = BigInt.zero();
  entity.feePpm = event.params.feePpm;
  entity.status = 'Pending';
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.paymentTokenAddress = event.params.paymentTokenAddress;
  entity.templateAddress = event.params.templateAddress;
  entity.expirationDate = event.block.timestamp.plus(
    event.params.offerDuration,
  );
  entity.offerDuration = event.params.offerDuration;
  entity.save();

  for (let i = 0; i < collaterals.length; i++) {
    const element = collaterals[i];
    const collateral = new AdvanceContractCollateral(
      event.params.advanceContract.concat(element.tokenAddress),
    );
    collateral.advanceContract = entity.id;
    collateral.tokenAddress = element.tokenAddress;
    collateral.tokenId = element.tokenId;
    collateral.tokenAmount = element.tokenAmount;
    collateral.save();
  }

  RoyaltyAdvance.create(event.params.advanceContract);

  createExpense(event.transaction.hash, entity.id, 'AdvanceCreated', event);

  recordStats(true);
}
