import {
  LoanRepaid,
  LoanRevoked,
  LoanContract,
  LoanProvided,
  InitializedLoan,
  LoanPartialyRepaid,
} from '../generated/schema';
import {
  LoanRepaid as LoanRepaidEvent,
  Initialized as InitializedEvent,
  LoanRevoked as LoanRevokedEvent,
  LoanProvided as LoanProvidedEvent,
  LoanPartialyRepaid as LoanPartialyRepaidEvent,
} from '../generated/templates/RoyaltyLoan/RoyaltyLoan';
import { createExpense } from './expense';

export function handleInitialized(event: InitializedEvent): void {
  const entity = new InitializedLoan(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.version = event.params.version;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}

export function handleLoanProvided(event: LoanProvidedEvent): void {
  const entity = new LoanProvided(event.address);
  entity.lender = event.params.lender;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const loan = LoanContract.load(event.address);
  if (loan !== null) {
    loan.status = 'Active';
    loan.save();
  }

  createExpense(event.transaction.hash, event.address, 'LoanProvided', event);
}

export function handleLoanPartialyRepaid(event: LoanPartialyRepaidEvent): void {
  const entity = new LoanPartialyRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.loanContract = event.address;
  entity.repaymentAmount = event.params.repaymentAmount;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const loan = LoanContract.load(event.address);
  if (loan !== null) {
    loan.repaidAmount = loan.repaidAmount.plus(event.params.repaymentAmount);
    loan.save();
  }

  createExpense(event.transaction.hash, event.address, 'LoanRepaid', event);
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  const entity = new LoanRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.loanContract = event.address;
  entity.repaymentAmount = event.params.repaymentAmount;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const loan = LoanContract.load(event.address);
  if (loan !== null) {
    loan.repaidAmount = loan.repaidAmount.plus(event.params.repaymentAmount);
    loan.status = 'Recouped';
    loan.loanRepaid = entity.id;
    loan.save();
  }

  createExpense(event.transaction.hash, event.address, 'LoanRepaid', event);
}

export function handleLoanRevoked(event: LoanRevokedEvent): void {
  const entity = new LoanRevoked(event.address);
  entity.loanContract = event.address;
  entity.timestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  const loan = LoanContract.load(event.address);
  if (loan !== null) {
    loan.status = 'Revoked';
    loan.save();
  }

  createExpense(event.transaction.hash, event.address, 'LoanRevoked', event);
}
