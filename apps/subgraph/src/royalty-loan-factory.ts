import {
  Initialized as InitializedEvent,
  LoanPartialyRepaid as LoanPartialyRepaidEvent,
  LoanProvided as LoanProvidedEvent,
  LoanRepaid as LoanRepaidEvent,
  LoanRevoked as LoanRevokedEvent
} from "../generated/Contract/Contract"
import {
  Initialized,
  LoanPartialyRepaid,
  LoanProvided,
  LoanRepaid,
  LoanRevoked
} from "../generated/schema"

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoanPartialyRepaid(event: LoanPartialyRepaidEvent): void {
  let entity = new LoanPartialyRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.repaymentAmount = event.params.repaymentAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoanProvided(event: LoanProvidedEvent): void {
  let entity = new LoanProvided(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lender = event.params.lender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoanRepaid(event: LoanRepaidEvent): void {
  let entity = new LoanRepaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.repaymentAmount = event.params.repaymentAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLoanRevoked(event: LoanRevokedEvent): void {
  let entity = new LoanRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
