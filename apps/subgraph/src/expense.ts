import { Address, Bytes } from '@graphprotocol/graph-ts';
import { Expense } from '../generated/schema';

export function createExpense(
  txHash: Bytes,
  loanContract: Address,
  kind: string,
): Expense {
  const expenseId = txHash.concat(Bytes.fromUTF8(':expense'));
  const expense = new Expense(expenseId);
  expense.loanContract = loanContract;
  expense.kind = kind;
  expense.transactionHash = txHash;
  expense.save();

  return expense;
}
