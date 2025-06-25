import { InitializedLoan } from '../generated/schema';
import { Initialized as InitializedEvent } from '../generated/templates/RoyaltyLoan/RoyaltyLoan';

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
