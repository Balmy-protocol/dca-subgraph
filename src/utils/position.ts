import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import { Transaction, Position, PairSwap, Pair, PositionState } from '../../generated/schema';
import { Deposited, Modified, Terminated, Withdrew } from '../../generated/Factory/Pair';
import * as pairLibrary from './pair';
import * as positionStateLibrary from './position-state';
import * as tokenLibrary from './token';
import { ONE_BI, ZERO_BI } from './constants';

export function create(event: Deposited, transaction: Transaction): Position {
  let id = getIdByPairAddressAndPositionId(event.transaction.to!, event.params._dcaId.toString());
  log.warning('[Position] Create {}', [id]);
  let position = Position.load(id);
  let pair = pairLibrary.get(event.transaction.to.toHexString());
  let from = tokenLibrary.getOrCreate(event.params._fromToken);
  if (position == null) {
    position = new Position(id);
    position.dcaId = event.params._dcaId.toString();
    position.user = transaction.from!;
    position.from = from.id;
    position.to = position.from == pair.tokenA ? pair.tokenB : pair.tokenA;
    position.pair = pair.id;
    position.swapInterval = event.params._swapInterval.toString();
    position.startedAtSwap = event.params._startingSwap;
    position.totalWithdrawn = ZERO_BI;
    position.totalSwapped = ZERO_BI;
    position.totalDeposits = event.params._rate.times(event.params._startingSwap);
    position.totalSwaps = ZERO_BI;
    position.status = 'ACTIVE';
    position.transaction = transaction.id;
    position.createdAtBlock = transaction.blockNumber;
    position.createdAtTimestamp = transaction.timestamp;

    // Create position state
    let positionState = positionStateLibrary.create(id, event.params._rate, event.params._startingSwap, event.params._lastSwap, transaction);
    position.totalSwaps = positionState.remainingSwaps;
    position.current = positionState.id;
    position.save();

    // TODO: remove this patch
    pair.highestId = pair.highestId.plus(ONE_BI);
    pair.save();
  }
  return position!;
}

export function getIdByPairAddressAndPositionId(pairAddress: Address, positionId: string): string {
  return pairAddress.toHexString().concat('-').concat(positionId);
}

export function getIdByPairIdAndPositionId(pairId: string, positionId: string): string {
  return pairId.concat('-').concat(positionId);
}

export function getIdByPairAndPositionId(pair: Pair, positionId: string): string {
  return getIdByPairIdAndPositionId(pair.id, positionId);
}

export function getByPairAddressAndPositionId(pairAddress: Address, positionId: string): Position {
  let id = getIdByPairAddressAndPositionId(pairAddress, positionId);
  log.warning('[Position] Get by pair address and id {}', [positionId]);
  return getById(id);
}

export function getByPairAndPositionId(pair: Pair, positionId: string): Position {
  let id = getIdByPairAndPositionId(pair, positionId);
  log.warning('[Position] Get by pair and id {}', [id]);
  return getById(id);
}

export function getById(id: string): Position {
  log.warning('[Position] Get {}', [id]);
  let position = Position.load(id);
  if (position == null) throw Error('Position not found');
  return position!;
}

export function modified(event: Modified, transaction: Transaction): Position {
  let id = getIdByPairAddressAndPositionId(event.transaction.to!, event.params._dcaId.toString());
  log.warning('[Position] Modified {}', [id]);
  let position = getById(id);
  let previousPositionState = positionStateLibrary.get(position.current);
  let newPositionState = positionStateLibrary.create(id, event.params._rate, event.params._startingSwap, event.params._lastSwap, transaction);
  position.totalDeposits = position.totalDeposits.minus(previousPositionState.remainingLiquidity).plus(newPositionState.remainingLiquidity);
  position.totalSwaps = position.totalSwaps.minus(previousPositionState.remainingSwaps).plus(newPositionState.remainingSwaps);
  position.current = newPositionState.id;
  position.save();
  return position;
}

export function terminated(event: Terminated, transaction: Transaction): Position {
  let id = getIdByPairAddressAndPositionId(event.transaction.to!, event.params._dcaId.toString());
  log.warning('[Position] Terminated {}', [id]);
  let position = getById(id);
  position.status = 'TERMINATED';
  position.terminatedAtBlock = transaction.blockNumber;
  position.terminatedAtTimestamp = transaction.timestamp;
  position.save();
  return position;
}

export function withdrew(event: Withdrew, transaction: Transaction): Position {
  let id = getIdByPairAddressAndPositionId(event.transaction.to!, event.params._dcaId.toString());
  log.warning('[Position] Withdrew {}', [id]);
  let position = getById(id);
  positionStateLibrary.registerWithdrew(position.current, event.params._amount);
  position.totalWithdrawn = position.totalWithdrawn.plus(event.params._amount);
  position.save();
  return position;
}

export function registerPairSwap(positionId: string, pair: Pair, pairSwap: PairSwap): Position {
  log.warning('[Position] Register pair swap for position {}', [positionId]);
  let position = getByPairAndPositionId(pair, positionId);
  let currentState = positionStateLibrary.get(position.current);
  if (shouldRegisterPairSwap(position)) {
    let rate = position.from == pair.tokenA ? pairSwap.ratePerUnitAToBWithFee : pairSwap.ratePerUnitBToAWithFee;
    let swapped = rate.times(currentState.rate).div(tokenLibrary.getMangitudeOf(position.from));
    positionStateLibrary.registerPairSwap(position.current, position, swapped);
    position.totalSwapped = position.totalSwapped.plus(swapped);
    position.totalSwaps = position.totalSwaps.plus(ONE_BI);
    position.save();
  }
  return position;
}

function shouldRegisterPairSwap(position: Position): boolean {
  let currentState = positionStateLibrary.get(position.current);
  return position.status != 'TERMINATED' && currentState.remainingSwaps.gt(ZERO_BI);
}
