import { newMockEvent } from 'matchstick-as';
import { ethereum, BigInt } from '@graphprotocol/graph-ts';
import { Initialized } from '../generated/RoyaltyLoan/RoyaltyLoan';

export function createInitializedEvent(version: BigInt): Initialized {
  const initializedEvent = changetype<Initialized>(newMockEvent());

  initializedEvent.parameters = [];

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      'version',
      ethereum.Value.fromUnsignedBigInt(version),
    ),
  );

  return initializedEvent;
}
