import * as transactionLibrary from '../utils/transaction';
import * as pairLibrary from '../utils/pair';
import * as positionLibrary from '../utils/position';
import { Deposited, Modified, Swapped, Terminated, Withdrew, WithdrewMany, Transfer } from '../../generated/Factory/Pair';

export function handleDeposited(event: Deposited): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Deposited');
  positionLibrary.create(event, transaction);
}

export function handleModified(event: Modified): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Modified');
  positionLibrary.modified(event, transaction);
}

export function handleTerminated(event: Terminated): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Terminated');
  positionLibrary.terminated(event, transaction);
}

export function handleWithdrew(event: Withdrew): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Withdrew');
  positionLibrary.withdrew(event, transaction);
}

export function handleWithdrewMany(event: WithdrewMany): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'WithdrewMany');
  // positionLibrary.getOrCreate(event, transaction);
}

export function handleSwapped(event: Swapped): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Swapped');
  pairLibrary.swapped(event, transaction);
}

export function handlePositionTransfer(event: Transfer): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Swapped');
  positionLibrary.transfer(event, transaction);
}
