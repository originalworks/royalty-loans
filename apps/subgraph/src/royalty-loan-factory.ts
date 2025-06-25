import { RoyaltyLoan } from '../generated/templates';
import {
  Initialized as InitializedEvent,
  LoanContractCreated as LoanContractCreatedEvent,
} from '../generated/RoyaltyLoanFactory/RoyaltyLoanFactory';
import { InitializedFactory, LoanContractCreated } from '../generated/schema';

export function handleInitialized(event: InitializedEvent): void {
  const entity = new InitializedFactory(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.version = event.params.version;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLoanContractCreated(
  event: LoanContractCreatedEvent,
): void {
  const entity = new LoanContractCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  entity.loanContract = event.params.loanContract;
  entity.borrower = event.params.borrower;
  entity.collateralToken = event.params.collateralToken;
  entity.collateralTokenId = event.params.collateralTokenId;
  entity.collateralAmount = event.params.collateralAmount;
  entity.loanAmount = event.params.loanAmount;
  entity.feePpm = event.params.feePpm;
  entity.save();

  RoyaltyLoan.create(event.params.loanContract);
}
