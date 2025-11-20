import { BigInt } from '@graphprotocol/graph-ts';

import { Stats } from '../generated/schema';

export function initializeStats(): void {
  let entity = Stats.load('status');

  if (entity == null) {
    entity = new Stats('status');
    entity.contractsCount = BigInt.zero();
    entity.expensesCount = BigInt.zero();
    entity.save();
  }
}

export function recordStats(isContract: boolean): void {
  let stats = Stats.load('status');

  if (stats == null) {
    stats = new Stats('status');
    stats.contractsCount = BigInt.zero();
    stats.expensesCount = BigInt.zero();
  }
  if (isContract) {
    stats.contractsCount = stats.contractsCount.plus(BigInt.fromI32(1));
  } else {
    stats.expensesCount = stats.expensesCount.plus(BigInt.fromI32(1));
  }

  stats.save();
}
