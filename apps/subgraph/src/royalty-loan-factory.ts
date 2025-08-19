import { BigInt } from '@graphprotocol/graph-ts';

import { RoyaltyLoan } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  LoanContractCreated as LoanContractCreatedEvent,
} from '../generated/RoyaltyLoanFactory/RoyaltyLoanFactory';
import { InitializedFactory, LoanContract } from '../generated/schema';
import { createExpense } from './expense';
import { initializeStats, recordStats } from './helpers';

export function handleInitialized(event: InitializedEvent): void {
  const entity = new InitializedFactory(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.version = event.params.version;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  initializeStats();
}

export function handleLoanContractCreated(
  event: LoanContractCreatedEvent,
): void {
  const entity = new LoanContract(event.params.loanContract);
  entity.loanContract = event.params.loanContract;
  entity.borrower = event.params.borrower;
  entity.collateralToken = event.params.collateralToken;
  entity.collateralTokenId = event.params.collateralTokenId;
  entity.collateralAmount = event.params.collateralAmount;
  entity.loanAmount = event.params.loanAmount;
  entity.recoupmentAmount = event.params.loanAmount.plus(
    event.params.loanAmount
      .times(event.params.feePpm)
      .div(BigInt.fromI32(1000000)),
  );
  entity.repaidAmount = BigInt.zero();
  entity.actualRepaid = BigInt.zero();
  entity.feePpm = event.params.feePpm;
  entity.status = 'Pending';
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  RoyaltyLoan.create(event.params.loanContract);

  createExpense(event.transaction.hash, entity.id, 'LoanCreated', event);

  recordStats(true);
}
