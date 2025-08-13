import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { Expense } from '../generated/schema';
import { recordStats } from './helpers';

export function createExpense(
  txHash: Bytes,
  loanContract: Bytes,
  kind: string,
  event: ethereum.Event,
  value: BigInt | null = null,
): Expense {
  const expenseId = txHash.concat(Bytes.fromUTF8(':expense'));
  const expense = new Expense(expenseId);
  expense.loanContract = loanContract;
  expense.transactionHash = txHash;
  expense.kind = kind;
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

  expense.save();

  recordStats(false);

  return expense;
}
