import {
  AdvanceRepaid,
  AdvanceRevoked,
  AdvanceContract,
  AdvanceProvided,
  AdvancePartiallyRepaid,
} from '../generated/schema';
import {
  AdvanceRepaid as AdvanceRepaidEvent,
  AdvanceRevoked as AdvanceRevokedEvent,
  AdvanceProvided as AdvanceProvidedEvent,
  AdvancePartiallyRepaid as AdvancePartiallyRepaidEvent,
} from '../generated/templates/RoyaltyAdvance/RoyaltyAdvance';
import { createExpense } from './expense';

export function handleAdvanceProvided(event: AdvanceProvidedEvent): void {
  const entity = new AdvanceProvided(event.address);
  entity.advancer = event.params.advancer;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const advance = AdvanceContract.load(event.address);
  if (advance !== null) {
    advance.status = 'Active';
    advance.save();
  }

  createExpense(
    event.transaction.hash,
    event.address,
    'AdvanceProvided',
    event,
  );
}

export function handleAdvancePartiallyRepaid(
  event: AdvancePartiallyRepaidEvent,
): void {
  const entity = new AdvancePartiallyRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.advanceContract = event.address;
  entity.repaymentAmount = event.params.repaymentAmount;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const advance = AdvanceContract.load(event.address);
  if (advance !== null) {
    advance.repaidAmount = advance.repaidAmount.plus(
      event.params.repaymentAmount,
    );
    advance.save();
  }

  createExpense(event.transaction.hash, event.address, 'AdvanceRepaid', event);
}

export function handleAdvanceRepaid(event: AdvanceRepaidEvent): void {
  const entity = new AdvanceRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.advanceContract = event.address;
  entity.repaymentAmount = event.params.repaymentAmount;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const advance = AdvanceContract.load(event.address);
  if (advance !== null) {
    advance.repaidAmount = advance.repaidAmount.plus(
      event.params.repaymentAmount,
    );
    advance.status = 'Recouped';
    advance.advanceRepaid = entity.id;
    advance.save();
  }

  createExpense(event.transaction.hash, event.address, 'AdvanceRepaid', event);
}

export function handleAdvanceRevoked(event: AdvanceRevokedEvent): void {
  const entity = new AdvanceRevoked(event.address);
  entity.advanceContract = event.address;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const advance = AdvanceContract.load(event.address);
  if (advance !== null) {
    advance.status = 'Revoked';
    advance.save();
  }

  createExpense(event.transaction.hash, event.address, 'AdvanceRevoked', event);
}
