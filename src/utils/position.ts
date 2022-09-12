import { log, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import { Transaction, Position, PairSwap, Pair } from '../../generated/schema';
import { Deposited, Modified, Terminated } from '../../generated/Hub/Hub';
import { Modified as PermissionsModified } from '../../generated/PermissionsManager/PermissionsManager';
import { Transfer } from '../../generated/PermissionsManager/PermissionsManager';
import * as pairLibrary from './pair';
import * as permissionsLibrary from './permissions';

import * as positionActionLibrary from './position-action';
import * as tokenLibrary from './token';
import { ONE_BI, ZERO_BI } from './constants';

export function create(event: Deposited, transaction: Transaction): Position {
  const id = event.params.positionId.toString();
  log.info('[Position] Create {}', [id]);
  const from = tokenLibrary.getByAddress(event.params.fromToken);
  const to = tokenLibrary.getByAddress(event.params.toToken);
  const pairId = pairLibrary.buildId(from.id, to.id);
  let pair = pairLibrary.get(pairId);
  if (pair == null) {
    pair = pairLibrary.create(pairId, event.params.fromToken, event.params.toToken, event.params.swapInterval, transaction);
  }
  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);
    position.user = event.params.owner;
    position.from = from.id;
    position.to = to.id;
    position.pair = pair.id;
    position.swapInterval = event.params.swapInterval.toString();

    position.status = 'ACTIVE';
    position.permissions = permissionsLibrary.createFromDepositedPermissionsStruct(id, event.params.permissions);

    position.rate = event.params.rate;
    position.remainingSwaps = event.params.lastSwap.minus(event.params.startingSwap).plus(ONE_BI);
    position.remainingLiquidity = event.params.rate.times(position.remainingSwaps);
    position.toWithdraw = ZERO_BI;
    position.withdrawn = ZERO_BI;

    position.swappedBeforeModified = ZERO_BI;
    position.ratioAccumulator = ZERO_BI;

    if (from.type == 'YIELD_BEARING_SHARE') {
      position.depositedRateUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(event.params.fromToken, event.params.rate);
    }
    if (to.type === 'YIELD_BEARING_SHARE') {
      position.accumSwappedUnderlying = ZERO_BI;
    }

    position.totalWithdrawn = ZERO_BI;
    position.totalSwapped = ZERO_BI;
    position.totalExecutedSwaps = ZERO_BI;

    position.transaction = transaction.id;
    position.createdAtBlock = transaction.blockNumber;
    position.createdAtTimestamp = transaction.timestamp;

    // Create position action
    positionActionLibrary.create(id, event.params.rate, event.params.startingSwap, event.params.lastSwap, position.permissions, transaction);

    position.totalDeposited = event.params.rate.times(position.remainingSwaps);
    position.totalSwaps = position.remainingSwaps;
    position.save();

    pairLibrary.addActivePosition(position);
  }
  return position;
}

export function getById(id: string): Position {
  log.info('[Position] Get {}', [id]);
  const position = Position.load(id);
  if (position == null) throw Error('Position not found');
  return position;
}

export function modified(event: Modified, transaction: Transaction): Position {
  const id = event.params.positionId.toString();
  const position = getById(event.params.positionId.toString());
  const from = tokenLibrary.getById(position.from);
  log.info('[Position] Modified {}', [id]);

  // Auxiliar previous position values
  const previousPositionRate = position.rate;
  const previousRemainingSwaps = position.remainingSwaps;
  const previousRemainingLiquidity = position.remainingLiquidity;
  const previousToWithdraw = position.toWithdraw;

  // Re-assign current position state
  position.rate = event.params.rate;
  position.remainingSwaps = event.params.lastSwap.minus(event.params.startingSwap).plus(ONE_BI);
  position.remainingLiquidity = event.params.rate.times(position.remainingSwaps);

  position.withdrawn = ZERO_BI;
  position.ratioAccumulator = ZERO_BI;
  position.swappedBeforeModified = previousToWithdraw;

  position.totalDeposited = position.totalDeposited.minus(previousRemainingLiquidity).plus(position.remainingLiquidity);
  position.totalSwaps = position.totalSwaps.minus(previousRemainingSwaps).plus(position.remainingSwaps);

  if (from.type == 'YIELD_BEARING_SHARE') {
    const changeInAmount = event.params.rate.times(position.remainingSwaps).minus(previousPositionRate.times(previousRemainingSwaps));
    if (changeInAmount.gt(ZERO_BI)) {
      const previousTotalUnderlyingRemaining = position.depositedRateUnderlying!.times(position.remainingSwaps);
      const underlyingValueOfIncreasedAmount = tokenLibrary.transformYieldBearingSharesToUnderlying(
        Address.fromString(position.from),
        changeInAmount
      );
      const newTotalUnderlying = previousTotalUnderlyingRemaining.plus(underlyingValueOfIncreasedAmount);
      // underlyingRate = (underlyingRate * remainingSwaps + toUnderlying(increaseAmount)) / newSwaps
      position.depositedRateUnderlying = newTotalUnderlying.div(position.remainingSwaps);
    } else {
      // underlyingRate = (newRate * underlyingRate) / oldRate
      position.depositedRateUnderlying = event.params.rate.times(position.depositedRateUnderlying!).div(previousPositionRate);
    }
  }

  // Remove position from active pairs if modified to have zero remaining swaps (soft termination)
  if (position.remainingSwaps.equals(ZERO_BI)) {
    pairLibrary.removeActivePosition(position);
    position.status = 'COMPLETED';
  } else {
    position.status = 'ACTIVE';
    pairLibrary.addActivePosition(position);
  }
  position.save();
  //

  // Position action
  if (!previousPositionRate.equals(event.params.rate) && !previousRemainingSwaps.equals(position.remainingSwaps)) {
    positionActionLibrary.modifiedRateAndDuration(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      previousPositionRate,
      previousRemainingSwaps,
      transaction
    );
  } else if (!previousPositionRate.equals(event.params.rate)) {
    positionActionLibrary.modifiedRate(id, event.params.rate, previousPositionRate, transaction);
  } else {
    positionActionLibrary.modifiedDuration(id, event.params.startingSwap, event.params.lastSwap, previousRemainingSwaps, transaction);
  }
  return position;
}

export function terminated(event: Terminated, transaction: Transaction): Position {
  const id = event.params.positionId.toString();
  log.info('[Position] Terminated {}', [id]);
  const position = getById(id);

  position.rate = ZERO_BI;
  position.remainingSwaps = ZERO_BI;
  position.remainingLiquidity = ZERO_BI;
  position.toWithdraw = ZERO_BI;
  position.withdrawn = position.withdrawn.plus(position.toWithdraw);
  position.status = 'TERMINATED';

  position.terminatedAtBlock = transaction.blockNumber;
  position.terminatedAtTimestamp = transaction.timestamp;

  // Position action
  positionActionLibrary.terminated(id, transaction);

  // Save position
  position.save();

  // Remove position from actives
  pairLibrary.removeActivePosition(position);

  return position;
}

export function withdrew(positionId: string, transaction: Transaction): Position {
  log.info('[Position] Withdrew {}', [positionId]);
  const position = getById(positionId);
  const previousToWithdraw = position.toWithdraw;

  position.toWithdraw = ZERO_BI;
  position.withdrawn = position.withdrawn.plus(previousToWithdraw);
  position.totalWithdrawn = position.totalWithdrawn.plus(previousToWithdraw);
  position.save();
  //
  // Position action
  positionActionLibrary.withdrew(positionId, previousToWithdraw, transaction);
  //
  return position;
}

export function shouldRegisterPairSwap(positionId: string, intervalsInSwap: BigInt[]): boolean {
  const position = getById(positionId);

  for (let i: i32 = 0; i < intervalsInSwap.length; i++) {
    if (intervalsInSwap[i].equals(BigInt.fromString(position.swapInterval))) {
      return true;
    }
  }
  return false;
}

export function registerPairSwap(positionId: string, pair: Pair, pairSwap: PairSwap, transaction: Transaction): Position {
  log.info('[Position] Register pair swap for position {}', [positionId]);
  const position = getById(positionId);
  const from = tokenLibrary.getById(position.from);
  const to = tokenLibrary.getById(position.to);

  const ratioFromTo = position.from == pair.tokenA ? pairSwap.ratioPerUnitAToBWithFee : pairSwap.ratioPerUnitBToAWithFee;
  const swapped = ratioFromTo.times(position.rate).div(from.magnitude);

  position.remainingSwaps = position.remainingSwaps.minus(ONE_BI);
  position.remainingLiquidity = position.remainingLiquidity.minus(position.rate);
  position.ratioAccumulator = position.ratioAccumulator.plus(ratioFromTo);

  const augmentedSwapped = position.ratioAccumulator.times(position.rate);
  const totalSwappedSinceModification = augmentedSwapped.div(from.magnitude);
  const totalSwapped = position.swappedBeforeModified.plus(totalSwappedSinceModification);

  position.toWithdraw = totalSwapped.minus(position.withdrawn);
  if (to.type == 'YIELD_BEARING_SHARE') {
    position.accumSwappedUnderlying = position.accumSwappedUnderlying!.plus(
      tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(position.to), swapped)
    );
  }

  position.totalSwapped = position.totalSwapped.plus(swapped);
  position.totalExecutedSwaps = position.totalExecutedSwaps.plus(ONE_BI);

  if (position.remainingSwaps.equals(ZERO_BI)) {
    position.status = 'COMPLETED';
  }
  position.save();

  // Position action
  positionActionLibrary.swapped(position, swapped, position.rate, pairSwap, transaction);
  //

  return position;
}

export function transfer(event: Transfer, transaction: Transaction): void {
  const id = event.params.tokenId.toString();
  log.info('[Position] Transfer position {}', [id]);
  const position = Position.load(id);
  if (position != null) {
    position.user = event.params.to as Bytes;
    permissionsLibrary.deleteAll(position.permissions);
    positionActionLibrary.transfered(id, event.params.from, event.params.to, transaction);
    position.permissions = [];
    position.save();
  }
}

export function permissionsModified(event: PermissionsModified, transaction: Transaction): Position {
  const position = getById(event.params.tokenId.toString());
  const newAndModifiedPermissionsIds = permissionsLibrary.permissionsModified(position.id, event);
  position.permissions = newAndModifiedPermissionsIds.newPermissions;
  positionActionLibrary.permissionsModified(position.id, newAndModifiedPermissionsIds.modified, transaction);
  position.save();
  return position;
}
