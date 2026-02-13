import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { AdvanceContract, Expense } from '../generated/schema';
import { recordStats } from './helpers';

export function createExpense(
  txHash: Bytes,
  advanceContract: Bytes,
  kind: string,
  event: ethereum.Event,
  value: BigInt | null = null,
  from: Bytes | null = null,
): Expense {
  const expenseId = txHash.concat(Bytes.fromUTF8(':expense'));
  const expense = new Expense(expenseId);
  expense.advanceContract = advanceContract;
  expense.transactionHash = txHash;
  expense.kind = kind;
  expense.from = from;
  expense.baseFeePerGas = event.block.baseFeePerGas;
  expense.value = value;

  const transaction = event.transaction;
  expense.gasLimit = transaction.gasLimit;
  expense.gasPrice = transaction.gasPrice;
  expense.totalCost = BigInt.zero();

  const receipt = event.receipt;
  if (receipt != null) {
    expense.cumulativeGasUsed = receipt.cumulativeGasUsed;
    expense.gasUsed = receipt.gasUsed;
    expense.totalCost = receipt.gasUsed.times(transaction.gasPrice);
  }
  expense.timestamp = event.block.timestamp;

  expense.collaterals = [];
  const advance = AdvanceContract.load(advanceContract);
  if (advance !== null) {
    const collaterals = advance.collaterals.load();
    const collateralIds: Bytes[] = [];
    for (let i = 0; i < collaterals.length; i++) {
      collateralIds.push(collaterals[i].id);
    }
    expense.collaterals = collateralIds;
  }

  expense.save();

  recordStats(false);

  return expense;
}
