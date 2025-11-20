import { test, assert, describe, afterEach, clearStore } from 'matchstick-as';

import { BigInt } from '@graphprotocol/graph-ts';

import { handleInitialized } from '../src/royalty-loan-factory-v1';
import { createInitializedV1Event } from './royalty-loan-factory-utils';

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe('Describe entity assertions', () => {
  afterEach(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test('InitializedFactory created and stored', () => {
    const version = BigInt.fromI32(1);
    const newInitializedEvent = createInitializedV1Event(version);
    handleInitialized(newInitializedEvent);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.entityCount('InitializedFactory', 1);
    assert.fieldEquals(
      'InitializedFactory',
      '0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000',
      'version',
      '1',
    );
  });
});
