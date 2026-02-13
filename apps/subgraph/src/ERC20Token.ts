import {
  Approval as ApprovalEvent,
  Transfer as TransferEvent,
} from '../generated/ERC20Token/ERC20';
import { AdvanceContract } from '../generated/schema';
import { createExpense } from './expense';

export function handleERC20Transfer(event: TransferEvent): void {
  const advanceContract = AdvanceContract.load(event.params.to);

  if (advanceContract !== null) {
    createExpense(
      event.transaction.hash,
      advanceContract.id,
      'ERC20Transfer',
      event,
      event.params.value,
      event.params.from,
    );

    advanceContract.actualRepaid = advanceContract.actualRepaid.plus(
      event.params.value,
    );
    advanceContract.save();
  }
}

export function handleERC20Approval(event: ApprovalEvent): void {
  const advanceContract = AdvanceContract.load(event.params.spender);

  if (advanceContract !== null) {
    createExpense(
      event.transaction.hash,
      advanceContract.id,
      'ERC20Approve',
      event,
    );
  }
}
