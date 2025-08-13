import {
  Approval as ApprovalEvent,
  Transfer as TransferEvent,
} from '../generated/ERC20Token/ERC20';
import { LoanContract } from '../generated/schema';
import { createExpense } from './expense';

export function handleERC20Transfer(event: TransferEvent): void {
  const loanContract = LoanContract.load(event.params.to);

  if (loanContract !== null) {
    createExpense(
      event.transaction.hash,
      loanContract.id,
      'ERC20Transfer',
      event,
    );

    loanContract.actualRepaid = loanContract.actualRepaid.plus(
      event.params.value,
    );
    loanContract.save();
  }
}

export function handleERC20Approval(event: ApprovalEvent): void {
  const loanContract = LoanContract.load(event.params.spender);

  if (loanContract !== null) {
    createExpense(
      event.transaction.hash,
      loanContract.id,
      'ERC20Approve',
      event,
    );
  }
}
