import { BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Expense, LoanContract } from '../generated/schema';
import { recordStats } from './helpers';

export function createExpense(
  txHash: Bytes,
  loanContract: Bytes,
  kind: string,
  timestamp: BigInt,
  value: BigInt | null = null,
  from: Bytes | null = null,
): void {
  const expenseId = txHash.concat(Bytes.fromUTF8(':expense'));
  const expense = new Expense(expenseId);
  expense.from = from;
  expense.kind = kind;
  expense.value = value;
  expense.loanContract = loanContract;
  expense.collaterals = [];
  expense.transactionHash = txHash;
  expense.timestamp = timestamp;

  const loan = LoanContract.load(loanContract);
  if (loan !== null) {
    const collaterals = loan.collaterals.load();
    const collateralIds: Bytes[] = [];
    for (let i = 0; i < collaterals.length; i++) {
      collateralIds.push(collaterals[i].id);
    }
    expense.collaterals = collateralIds;
  }

  expense.save();

  recordStats(false);
}
