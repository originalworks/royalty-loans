import { BigInt, Address } from '@graphprotocol/graph-ts';

import { RoyaltyLoan } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  LoanContractCreated as LoanContractCreatedEventNew,
  LoanContractCreated1 as LoanContractCreatedEventOld,
} from '../generated/RoyaltyLoanFactory/RoyaltyLoanFactory';
import { LoanContract, LoanContractCollateral } from '../generated/schema';
import { createExpense } from './expense';
import { initializeStats, recordStats } from './helpers';

const offerDuration = 432000;

export function handleInitialized(event: InitializedEvent): void {
  initializeStats();
}

export function handleLoanContractCreatedNew(
  event: LoanContractCreatedEventNew,
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
  entity.paymentTokenAddress = event.params.paymentTokenAddress;
  entity.templateAddress = event.params.templateAddress;
  entity.expirationDate = event.block.timestamp.plus(
    event.params.offerDuration,
  );
  entity.offerDuration = event.params.offerDuration;
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

export function handleLoanContractCreatedOld(
  event: LoanContractCreatedEventOld,
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
  entity.paymentTokenAddress = Address.zero();
  entity.templateAddress = Address.zero();
  entity.expirationDate = event.block.timestamp.plus(
    BigInt.fromI32(offerDuration),
  );
  entity.offerDuration = BigInt.fromI32(offerDuration);
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
