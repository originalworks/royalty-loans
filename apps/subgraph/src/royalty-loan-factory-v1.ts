import { BigInt, Address } from '@graphprotocol/graph-ts';

import { RoyaltyLoan } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  LoanContractCreated as LoanContractCreatedEvent,
} from '../generated/RoyaltyLoanFactoryV1/RoyaltyLoanFactoryV1';
import { LoanContract, LoanContractCollateral } from '../generated/schema';
import { createExpense } from './expense';
import { initializeStats, recordStats } from './helpers';

const offerDuration = 432000;

export function handleInitialized(event: InitializedEvent): void {
  initializeStats();
}

export function handleLoanContractCreated(
  event: LoanContractCreatedEvent,
): void {
  const entity = new LoanContract(event.params.loanContract);
  entity.loanContract = event.params.loanContract;
  entity.borrower = event.params.borrower;
  entity.isPackLoan = false;
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

  const collateral = new LoanContractCollateral(
    event.params.loanContract.concat(event.params.collateralToken),
  );
  collateral.loanContract = entity.id;
  collateral.tokenAddress = event.params.collateralToken;
  collateral.tokenId = event.params.collateralTokenId;
  collateral.tokenAmount = event.params.collateralAmount;
  collateral.save();

  RoyaltyLoan.create(event.params.loanContract);

  createExpense(event.transaction.hash, entity.id, 'LoanCreated', event);

  recordStats(true);
}
