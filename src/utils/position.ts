import { log, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import { Transaction, Position, PairSwap, Pair, PositionState } from '../../generated/schema';
import { Deposited, Modified, Terminated, Withdrew, SwappedSwapInformationPairsStruct } from '../../generated/Hub/Hub';
import * as pairLibrary from './pair';
import * as positionStateLibrary from './position-state';
import * as tokenLibrary from './token';
import { ONE_BI, ZERO_BI } from './constants';
import { intervalsfromByte } from './intervals';

export function create(event: Deposited, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  log.info('[Position] Create {}', [id]);
  let from = tokenLibrary.getOrCreate(event.params.fromToken);
  let to = tokenLibrary.getOrCreate(event.params.toToken);
  let pairId = pairLibrary.buildId(from.id, to.id);
  let pair = pairLibrary.get(pairId);
  if (pair == null) {
    pair = pairLibrary.create(pairId, event.params.fromToken, event.params.toToken, transaction);
  }
  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);
    position.user = event.params.owner;
    position.from = from.id;
    position.to = to.id;
    position.pair = pair.id;
    position.swapInterval = event.params.swapInterval.toString();
    position.startedAtSwap = event.params.startingSwap;
    position.totalWithdrawn = ZERO_BI;
    position.totalSwapped = ZERO_BI;
    position.status = 'ACTIVE';
    position.transaction = transaction.id;
    position.createdAtBlock = transaction.blockNumber;
    position.createdAtTimestamp = transaction.timestamp;

    // Create position state
    let positionState = positionStateLibrary.create(id, event.params.rate, event.params.startingSwap, event.params.lastSwap, transaction);
    position.totalDeposits = event.params.rate.times(positionState.remainingSwaps);
    position.totalSwaps = positionState.remainingSwaps;
    position.current = positionState.id;
    position.save();

    // TODO: remove this patch
    let newPositionIds = pair.positionIds;
    newPositionIds.push(id);
    pair.positionIds = newPositionIds;
    pair.save();
  }
  return position!;
}

export function getById(id: string): Position {
  log.info('[Position] Get {}', [id]);
  let position = Position.load(id);
  if (position == null) throw Error('Position not found');
  return position!;
}

export function modified(event: Modified, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  let position = getById(event.params.positionId.toString());
  log.info('[Position] Modified {}', [id]);
  let previousPositionState = positionStateLibrary.get(position.current);
  let newPositionState = positionStateLibrary.create(id, event.params.rate, event.params.startingSwap, event.params.lastSwap, transaction);
  position.totalDeposits = position.totalDeposits.minus(previousPositionState.remainingLiquidity).plus(newPositionState.remainingLiquidity);
  position.totalSwaps = position.totalSwaps.minus(previousPositionState.remainingSwaps).plus(newPositionState.remainingSwaps);
  position.current = newPositionState.id;
  position.save();
  return position;
}

export function terminated(event: Terminated, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  log.info('[Position] Terminated {}', [id]);
  let position = getById(id);
  position.status = 'TERMINATED';
  position.terminatedAtBlock = transaction.blockNumber;
  position.terminatedAtTimestamp = transaction.timestamp;
  position.save();
  return position;
}

export function withdrew(event: Withdrew, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  log.info('[Position] Withdrew {}', [id]);
  let position = getById(id);
  positionStateLibrary.registerWithdrew(position.current, event.params.amount);
  position.totalWithdrawn = position.totalWithdrawn.plus(event.params.amount);
  position.save();
  return position;
}

export function shouldRegister(status: String, remainingSwaps: BigInt, swapInterval: string, intervalsByte: Bytes): boolean {
  let canSwap = false;
  let intervals = intervalsfromByte(intervalsByte.toString());

  for (let i: i32 = 0; i <= intervals.length; i++) {
    if (BigInt.fromI32(intervals[i]).toString() == swapInterval) {
      canSwap = true;
      break;
    }
  }

  return status != 'TERMINATED' && remainingSwaps.gt(ZERO_BI) && canSwap;
}

export function registerPairSwap(positionId: string, pair: Pair, pairSwap: PairSwap, intervalsByte: Bytes): Position {
  log.info('[Position] Register pair swap for position {}', [positionId]);
  let position = getById(positionId);
  let currentState = positionStateLibrary.get(position.current);

  if (shouldRegister(position.status, currentState.remainingSwaps, position.swapInterval, intervalsByte)) {
    let rateOfSwap = position.from == pair.tokenA ? pairSwap.ratePerUnitAToBWithFee : pairSwap.ratePerUnitBToAWithFee;
    let swapped = rateOfSwap.times(currentState.rate).div(tokenLibrary.getMangitudeOf(position.from));
    positionStateLibrary.registerPairSwap(position.current, position, swapped);
    position.totalSwapped = position.totalSwapped.plus(swapped);
    position.save();
  }
  return position;
}

// export function transfer(event: Transfer, transaction: Transaction): Position {
//   let id = getIdByPairAddressAndPositionId(event.address, event.params.tokenId.toString());
//   log.info('[Position] Transfer {}', [id]);
//   let position = getById(id);
//   position.user = event.params.to as Bytes;
//   position.save();
//   return position;
// }
