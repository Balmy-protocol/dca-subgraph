import * as transactionLibrary from '../utils/transaction';
import * as pairLibrary from '../utils/pair';
import * as positionLibrary from '../utils/position';
import * as swapIntervalsLibrary from '../utils/swap-intervals';
import { Deposited, Modified, SwapIntervalsAllowed, Swapped, Terminated, Withdrew, WithdrewMany } from '../../generated/Hub/Hub';
import { ADDRESS_ZERO } from '../utils/constants';

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

export function handleSwapIntervalsAllowed(event: SwapIntervalsAllowed): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'SwapIntervalsAllowed');
  swapIntervalsLibrary.addSwapIntervals(event, transaction);
}

// export function handlePositionTransfer(event: Transfer): void {
//   if (event.params.from.toHexString() != ADDRESS_ZERO) {
//     let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Transfer');
//     positionLibrary.transfer(event, transaction);
//   }
// }
