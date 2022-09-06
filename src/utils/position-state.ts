import { log, BigInt } from '@graphprotocol/graph-ts';
import { Position, PositionState, Transaction } from '../../generated/schema';
import { ONE_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';

// Creates position state  with zero-ed values.
export function createBasic(positionId: string, rate: BigInt, startingSwap: BigInt, lastSwap: BigInt, transaction: Transaction): PositionState {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionState] Create basic {}', [id]);
  let positionState = PositionState.load(id);
  if (positionState == null) {
    positionState = new PositionState(id);
    positionState.position = positionId;

    positionState.rate = rate;
    positionState.startingSwap = startingSwap;
    positionState.lastSwap = lastSwap;

    positionState.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionState.swapped = ZERO_BI;
    positionState.idleSwapped = ZERO_BI;
    positionState.withdrawn = ZERO_BI;
    positionState.remainingLiquidity = rate.times(positionState.remainingSwaps);

    positionState.swappedBeforeModified = ZERO_BI;
    positionState.ratioAccumulator = ZERO_BI;

    positionState.transaction = transaction.id;
    positionState.createdAtBlock = transaction.blockNumber;
    positionState.createdAtTimestamp = transaction.timestamp;
    positionState.save();
  }
  return positionState;
}

// Creates a position state were all values are zero-ed except for idleSwapped and swappedBeforeModified. Only used when
// position was modified
export function createComposed(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  swappedBeforeModified: BigInt,
  transaction: Transaction
): PositionState {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionState] Create composed {}', [id]);
  let positionState = createBasic(positionId, rate, startingSwap, lastSwap, transaction);
  positionState.idleSwapped = swappedBeforeModified;
  positionState.swappedBeforeModified = swappedBeforeModified;
  positionState.save();
  return positionState;
}

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

  positionState.save();
  return positionState;
}

export function registerWithdrew(id: string, withdrawn: BigInt): PositionState {
  log.info('[PositionState] Register withdrew {}', [id]);
  let positionState = get(id);
  positionState.idleSwapped = positionState.idleSwapped.minus(withdrawn);
  positionState.withdrawn = positionState.withdrawn.plus(withdrawn);
  positionState.save();
  return positionState;
}

export function registerPairSwap(id: string, position: Position, ratio: BigInt): PositionState {
  log.info('[PositionState] Register pair swap {}', [id]);
  let positionState = get(id);
  let from = tokenLibrary.getById(position.from);

  positionState.ratioAccumulator = positionState.ratioAccumulator.plus(ratio);

  let augmentedSwapped = positionState.ratioAccumulator.times(positionState.rate);
  let totalSwapped = augmentedSwapped.div(from.magnitude);

  positionState.swapped = positionState.swappedBeforeModified.plus(totalSwapped);
  positionState.idleSwapped = positionState.swapped.minus(positionState.withdrawn);

  positionState.remainingSwaps = positionState.remainingSwaps.minus(ONE_BI);
  positionState.remainingLiquidity = positionState.remainingLiquidity.minus(positionState.rate);

  positionState.save();
  return positionState;
}

export class PositionStateAndModifiedPermissions {
  _positionState: PositionState;
  _modifiedPermissions: string[];

  constructor(positionState: PositionState, modifiedPermissions: string[]) {
    this._positionState = positionState;
    this._modifiedPermissions = modifiedPermissions;
  }

  get positionState(): PositionState {
    return this._positionState;
  }

  get modifiedPermissions(): string[] {
    return this._modifiedPermissions;
  }
}
