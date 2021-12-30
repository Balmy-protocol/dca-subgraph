import { log, BigInt } from '@graphprotocol/graph-ts';
import { Position, PositionState, Transaction } from '../../generated/schema';
import { ONE_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';

export function create(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  swappedBeforeModified: BigInt,
  transaction: Transaction
): PositionState {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionState] Create {}', [id]);
  let positionState = PositionState.load(id);
  if (positionState == null) {
    positionState = new PositionState(id);
    positionState.position = positionId;
    positionState.rate = rate;
    positionState.startingSwap = startingSwap;
    positionState.lastSwap = lastSwap;

    positionState.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionState.swapped = ZERO_BI;
    positionState.idleSwapped = swappedBeforeModified;
    positionState.withdrawn = ZERO_BI;
    positionState.remainingLiquidity = rate.times(positionState.remainingSwaps);

    positionState.swappedBeforeModified = swappedBeforeModified;
    positionState.rateAccumulator = ZERO_BI;

    positionState.transaction = transaction.id;
    positionState.createdAtBlock = transaction.blockNumber;
    positionState.createdAtTimestamp = transaction.timestamp;
    positionState.save();
  }
  return positionState;
}

// export function clone(positionId: string): PositionState {
//   let positionState = get(positionId);
//   positionState.id = '';
//   return positionState;
// }

export function get(id: string): PositionState {
  log.info('[PositionState] Get {}', [id]);
  let positionState = PositionState.load(id);
  if (positionState == null) throw Error('PositionState not found');
  return positionState;
}

export function registerTerminated(id: string): PositionState {
  log.info('[PositionState] Register terminated {}', [id]);
  let positionState = get(id);
  positionState.rate = ZERO_BI;

  positionState.remainingSwaps = ZERO_BI;
  positionState.idleSwapped = ZERO_BI;
  positionState.withdrawn = positionState.withdrawn.plus(positionState.idleSwapped);
  positionState.remainingLiquidity = ZERO_BI;

  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}

export function registerWithdrew(id: string, withdrawn: BigInt): PositionState {
  log.info('[PositionState] Register withdrew {}', [id]);
  let positionState = get(id);
  positionState.idleSwapped = positionState.idleSwapped.minus(withdrawn);
  positionState.withdrawn = positionState.withdrawn.plus(withdrawn);
  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}

export function registerTransfered(id: string): PositionState {
  log.info('[PositionState] Register transfered {}', [id]);
  let positionState = get(id);

  positionState.save();
  return positionState;
}

export function registerPairSwap(id: string, position: Position, ratio: BigInt): PositionState {
  log.info('[PositionState] Register pair swap {}', [id]);
  let positionState = get(id);
  let magnitude = tokenLibrary.getMagnitudeOf(position.from);

  positionState.rateAccumulator = positionState.rateAccumulator.plus(ratio);

  let augmentedSwapped = positionState.rateAccumulator.times(positionState.rate);
  let totalSwapped = augmentedSwapped.div(magnitude);

  positionState.swapped = positionState.swappedBeforeModified.plus(totalSwapped);
  positionState.idleSwapped = positionState.swapped.minus(positionState.withdrawn);

  positionState.remainingSwaps = positionState.remainingSwaps.minus(ONE_BI);
  positionState.remainingLiquidity = positionState.remainingLiquidity.minus(positionState.rate);

  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}
