import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import { Position, PositionState, Transaction } from '../../generated/schema';
import { ONE_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';

// Creates position state  with zero-ed values.
export function createBasic(position: Position, rate: BigInt, startingSwap: BigInt, lastSwap: BigInt, transaction: Transaction): PositionState {
  let id = position.id.concat('-').concat(transaction.id);
  log.info('[PositionState] Create basic {}', [id]);
  let positionState = PositionState.load(id);
  if (positionState == null) {
    positionState = new PositionState(id);
    positionState.position = position.id;

    positionState.rate = rate;

    positionState.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionState.toWithdraw = ZERO_BI;
    positionState.withdrawn = ZERO_BI;
    positionState.remainingLiquidity = rate.times(positionState.remainingSwaps);

    positionState.swappedBeforeModified = ZERO_BI;
    positionState.ratioAccumulator = ZERO_BI;

    const to = tokenLibrary.getById(position.to);
    if (to.type === 'YIELD_BEARING_SHARE') {
      positionState.accumSwappedUnderlying = ZERO_BI;
    }

    positionState.transaction = transaction.id;
    positionState.createdAtBlock = transaction.blockNumber;
    positionState.createdAtTimestamp = transaction.timestamp;
    positionState.save();
  }
  return positionState;
}

// Creates a position state were all values are zero-ed except for toWithdraw and swappedBeforeModified. Only used when
// position was modified
export function createComposed(
  position: Position,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  swappedBeforeModified: BigInt,
  accumSwappedUnderlying: BigInt | null,
  transaction: Transaction
): PositionState {
  let id = position.id.concat('-').concat(transaction.id);
  log.info('[PositionState] Create composed {}', [id]);
  let positionState = createBasic(position, rate, startingSwap, lastSwap, transaction);
  positionState.toWithdraw = swappedBeforeModified;
  positionState.accumSwappedUnderlying = accumSwappedUnderlying;
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
  positionState.toWithdraw = ZERO_BI;
  positionState.withdrawn = positionState.withdrawn.plus(positionState.toWithdraw);
  positionState.remainingLiquidity = ZERO_BI;

  positionState.save();
  return positionState;
}

export function registerWithdrew(id: string, withdrawn: BigInt): PositionState {
  log.info('[PositionState] Register withdrew {}', [id]);
  let positionState = get(id);
  positionState.toWithdraw = positionState.toWithdraw.minus(withdrawn);
  positionState.withdrawn = positionState.withdrawn.plus(withdrawn);
  positionState.save();
  return positionState;
}

export function registerPairSwap(id: string, position: Position, swapped: BigInt, ratio: BigInt): PositionState {
  log.info('[PositionState] Register pair swap {}', [id]);
  let positionState = get(id);
  let from = tokenLibrary.getById(position.from);

  positionState.ratioAccumulator = positionState.ratioAccumulator.plus(ratio);

  let augmentedSwapped = positionState.ratioAccumulator.times(positionState.rate);
  let totalSwappedSinceModification = augmentedSwapped.div(from.magnitude);
  let totalSwapped = positionState.swappedBeforeModified.plus(totalSwappedSinceModification);

  positionState.toWithdraw = totalSwapped.minus(positionState.withdrawn);
  if (positionState.accumSwappedUnderlying !== null) {
    positionState.accumSwappedUnderlying = positionState.accumSwappedUnderlying!.plus(
      tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(position.to), swapped)
    );
  }

  positionState.remainingSwaps = positionState.remainingSwaps.minus(ONE_BI);
  positionState.remainingLiquidity = positionState.remainingLiquidity.minus(positionState.rate);

  positionState.save();
  return positionState;
}

export class PositionStateAndModifiedPermissions {
  private _positionState: PositionState;
  private _modifiedPermissions: string[];

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
