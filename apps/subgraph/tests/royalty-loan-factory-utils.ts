import { newMockEvent } from 'matchstick-as';

import { ethereum, BigInt } from '@graphprotocol/graph-ts';

import { Initialized } from '../generated/RoyaltyLoanFactory/RoyaltyLoanFactory';
import { Initialized as InitializedV1 } from '../generated/RoyaltyLoanFactoryV1/RoyaltyLoanFactoryV1';

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

export function createInitializedV1Event(version: BigInt): InitializedV1 {
  const initializedEvent = changetype<InitializedV1>(newMockEvent());

  initializedEvent.parameters = [];

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      'version',
      ethereum.Value.fromUnsignedBigInt(version),
    ),
  );

  return initializedEvent;
}
