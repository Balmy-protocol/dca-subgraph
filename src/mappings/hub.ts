import * as transactionLibrary from '../utils/transaction';
import * as pairLibrary from '../utils/pair';
import * as positionLibrary from '../utils/position';
import * as swapIntervalsLibrary from '../utils/swap-intervals';
import {
  Deposited,
  Modified,
  RoleAdminChanged,
  SwapIntervalsAllowed,
  SwapIntervalsForbidden,
  Swapped,
  Terminated,
  Withdrew,
  WithdrewMany,
} from '../../generated/Hub/Hub';
import { BigInt } from '@graphprotocol/graph-ts';

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
  positionLibrary.withdrew(event.params.positionId.toString(), transaction);
}

export function handleWithdrewMany(event: WithdrewMany): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'WithdrewMany');
  let positions = event.params.positions;
  for (let i: i32 = 0; i < positions.length; i++) {
    positionLibrary.withdrew(event.params.positions[1].toString(), transaction);
  }
}

export function handleSwapped(event: Swapped): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Swapped');
  pairLibrary.swapped(event, transaction);
}

export function handleSwapIntervalsAllowed(event: SwapIntervalsAllowed): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'SwapIntervalsAllowed');
  swapIntervalsLibrary.addSwapIntervals(event, transaction);
}

export function handleSwapIntervalsDisabled(event: SwapIntervalsForbidden): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'SwapIntervalsAllowed');
  swapIntervalsLibrary.disableSwapIntervals(event, transaction);
}

export function dirtyInitialization(event: RoleAdminChanged): void {
  swapIntervalsLibrary.getOrCreate(BigInt.fromString('3600'), true);
  swapIntervalsLibrary.getOrCreate(BigInt.fromString('14400'), true);
  swapIntervalsLibrary.getOrCreate(BigInt.fromString('86400'), true);
  swapIntervalsLibrary.getOrCreate(BigInt.fromString('604800'), true);
}
// export function handlePositionTransfer(event: Transfer): void {
//   if (event.params.from.toHexString() != ADDRESS_ZERO) {
//     let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Transfer');
//     positionLibrary.transfer(event, transaction);
//   }
// }
