import { test, assert, describe, afterEach, clearStore } from 'matchstick-as';

import { BigInt } from '@graphprotocol/graph-ts';

import { handleInitialized } from '../src/royalty-loan';
import { createInitializedEvent } from './royalty-loan-utils';

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe('Describe entity assertions', () => {
  afterEach(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test('InitializedLoan created and stored', () => {
    const version = BigInt.fromI32(234);
    const newInitializedEvent = createInitializedEvent(version);
    handleInitialized(newInitializedEvent);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.entityCount('InitializedLoan', 1);
    assert.fieldEquals(
      'InitializedLoan',
      '0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000',
      'version',
      '234',
    );

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  });
});
