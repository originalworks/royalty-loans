import { BigInt } from '@graphprotocol/graph-ts';

import {
  InitializedFactory,
  LoanContract,
  LoanContractCollateral,
} from '../generated/schema';
import { RoyaltyLoan } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  LoanContractCreated as LoanContractCreatedEvent,
} from '../generated/RoyaltyLoanFactory/RoyaltyLoanFactory';
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
  const collaterals = event.params.collaterals;

  const entity = new LoanContract(event.params.loanContract);
  entity.loanContract = event.params.loanContract;
  entity.borrower = event.params.borrower;
  entity.isPackLoan = collaterals.length > 1;
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
  entity.expirationDate = BigInt.zero();
  entity.save();

  for (let i = 0; i < collaterals.length; i++) {
    const element = collaterals[i];
    const collateral = new LoanContractCollateral(
      event.params.loanContract.concat(element.tokenAddress),
    );
    collateral.loanContract = entity.id;
    collateral.tokenAddress = element.tokenAddress;
    collateral.tokenId = element.tokenId;
    collateral.tokenAmount = element.tokenAmount;
    collateral.save();
  }

  RoyaltyLoan.create(event.params.loanContract);

  createExpense(event.transaction.hash, entity.id, 'LoanCreated', event);

  recordStats(true);
}
