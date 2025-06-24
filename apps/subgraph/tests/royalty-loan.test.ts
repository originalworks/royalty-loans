import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from 'matchstick-as/assembly/index';
import { BigInt } from '@graphprotocol/graph-ts';
import { handleInitialized } from '../src/royalty-loan';
import { createInitializedEvent } from './royalty-loan-utils';

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe('Describe entity assertions', () => {
  beforeAll(() => {
    const version = BigInt.fromI32(234);
    const newInitializedEvent = createInitializedEvent(version);
    handleInitialized(newInitializedEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test('Initialized created and stored', () => {
    assert.entityCount('Initialized', 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      'Initialized',
      '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1',
      'version',
      '234',
    );

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  });
});
