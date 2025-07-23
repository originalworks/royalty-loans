import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { Expense } from '../generated/schema';

export function createExpense(
  txHash: Bytes,
  loanContract: Bytes,
  kind: string,
  event: ethereum.Event,
): Expense {
  const expenseId = txHash.concat(Bytes.fromUTF8(':expense'));
  const expense = new Expense(expenseId);
  expense.loanContract = loanContract;
  expense.kind = kind;
  expense.transactionHash = txHash;
  expense.baseFeePerGas = event.block.baseFeePerGas;

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

  expense.save();

  return expense;
}
