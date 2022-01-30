import { log, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import { Transaction, Position, PairSwap, Pair, PositionState } from '../../generated/schema';
import { Deposited, Modified, Terminated } from '../../generated/Hub/Hub';
import { Modified as PermissionsModified } from '../../generated/PermissionsManager/PermissionsManager';
import { Transfer } from '../../generated/PermissionsManager/PermissionsManager';
import * as pairLibrary from './pair';
import * as permissionsLibrary from './permissions';
import * as positionStateLibrary from './position-state';
import * as positionActionLibrary from './position-action';
import * as tokenLibrary from './token';
import { ZERO_BI } from './constants';

const ETH_ADDRESS = Address.fromString('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee').toHexString();
const WETH_ADDRESS = Address.fromString('0x4200000000000000000000000000000000000006').toHexString();

export function create(event: Deposited, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  log.info('[Position] Create {}', [id]);
  let from = tokenLibrary.getOrCreate(event.params.fromToken);
  let to = tokenLibrary.getOrCreate(event.params.toToken);
  let pairId = pairLibrary.buildId(from.id, to.id);
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
    position.startedAtSwap = event.params.startingSwap;
    position.totalWithdrawn = ZERO_BI;
    position.totalSwapped = ZERO_BI;
    position.status = 'ACTIVE';
    position.transaction = transaction.id;
    position.createdAtBlock = transaction.blockNumber;
    position.createdAtTimestamp = transaction.timestamp;

    // Create position state
    let positionState = positionStateLibrary.createBasic(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      permissionsLibrary.convertDepositedPermissionStructToCommon(event.params.permissions),
      transaction
    );

    // Create position action
    positionActionLibrary.create(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      positionState.permissions,
      transaction
    );

    position.totalDeposits = event.params.rate.times(positionState.remainingSwaps);
    position.totalSwaps = positionState.remainingSwaps;
    position.current = positionState.id;

    // Naive check for WETH or ETH deposit. Why naive ? Because multicall with multiple deposits might break this heuristic.
    // worst case scenario: it shows WETH instead of ETH.
    if (event.params.fromToken.toHexString() == WETH_ADDRESS && transaction.value.equals(position.totalDeposits)) {
      from = tokenLibrary.getOrCreate(Address.fromString(ETH_ADDRESS));
      position.from = from.id;
    }

    position.save();

    pairLibrary.addActivePosition(position);
  }
  return position;
}

export function getById(id: string): Position {
  log.info('[Position] Get {}', [id]);
  let position = Position.load(id);
  if (position == null) throw Error('Position not found');
  return position;
}

export function modified(event: Modified, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  let position = getById(event.params.positionId.toString());
  log.info('[Position] Modified {}', [id]);
  // Position state
  let previousPositionState = positionStateLibrary.get(position.current);
  let newPositionState = positionStateLibrary.createComposed(
    id,
    event.params.rate,
    event.params.startingSwap,
    event.params.lastSwap,
    previousPositionState.idleSwapped,
    previousPositionState.permissions,
    transaction
  );
  let oldPositionRate = previousPositionState.rate;
  let oldRemainingSwaps = previousPositionState.remainingSwaps;
  position.totalDeposits = position.totalDeposits.minus(previousPositionState.remainingLiquidity).plus(newPositionState.remainingLiquidity);
  position.totalSwaps = position.totalSwaps.minus(previousPositionState.remainingSwaps).plus(newPositionState.remainingSwaps);
  position.current = newPositionState.id;
  // Remove position from active pairs if modified to have zero remaining swaps (soft termination)
  if (newPositionState.remainingSwaps.equals(ZERO_BI)) {
    pairLibrary.removeActivePosition(position);
    position.status = 'COMPLETED';
  } else {
    position.status = 'ACTIVE';
    pairLibrary.addActivePosition(position);
  }
  position.save();
  //
  // Position action
  if (!previousPositionState.rate.equals(event.params.rate) && !previousPositionState.lastSwap.equals(event.params.lastSwap)) {
    positionActionLibrary.modifiedRateAndDuration(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      oldPositionRate,
      oldRemainingSwaps,
      transaction
    );
  } else if (!previousPositionState.rate.equals(event.params.rate)) {
    positionActionLibrary.modifiedRate(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      oldPositionRate,
      oldRemainingSwaps,
      transaction
    );
  } else {
    positionActionLibrary.modifiedDuration(
      id,
      event.params.rate,
      event.params.startingSwap,
      event.params.lastSwap,
      oldPositionRate,
      oldRemainingSwaps,
      transaction
    );
  }
  return position;
}

export function terminated(event: Terminated, transaction: Transaction): Position {
  let id = event.params.positionId.toString();
  log.info('[Position] Terminated {}', [id]);
  let position = getById(id);
  position.status = 'TERMINATED';
  position.terminatedAtBlock = transaction.blockNumber;
  position.terminatedAtTimestamp = transaction.timestamp;

  // Position state
  positionStateLibrary.registerTerminated(position.current);

  // Position action
  positionActionLibrary.terminated(id, transaction);

  position.save();

  // Remove position from actives
  pairLibrary.removeActivePosition(position);

  return position;
}

export function withdrew(positionId: string, transaction: Transaction): Position {
  log.info('[Position] Withdrew {}', [positionId]);
  let position = getById(positionId);
  let currentState = positionStateLibrary.get(position.current);
  // Position state
  positionStateLibrary.registerWithdrew(position.current, currentState.idleSwapped);
  position.totalWithdrawn = position.totalWithdrawn.plus(currentState.idleSwapped);
  position.save();
  //
  // Position action
  positionActionLibrary.withdrew(positionId, currentState.idleSwapped, transaction);
  //
  return position;
}

export function shouldRegisterPairSwap(positionId: string, intervalsInSwap: BigInt[]): boolean {
  let position = getById(positionId);

  for (let i: i32 = 0; i < intervalsInSwap.length; i++) {
    if (intervalsInSwap[i].equals(BigInt.fromString(position.swapInterval))) {
      return true;
    }
  }
  return false;
}

export function registerPairSwap(positionId: string, pair: Pair, pairSwap: PairSwap, transaction: Transaction): PositionAndPositionState {
  log.info('[Position] Register pair swap for position {}', [positionId]);
  let position = getById(positionId);
  let currentState = positionStateLibrary.get(position.current);
  let fromToUse = position.from == ETH_ADDRESS ? WETH_ADDRESS : position.from;

  let rateOfSwap = fromToUse == pair.tokenA ? pairSwap.ratePerUnitAToBWithFee : pairSwap.ratePerUnitBToAWithFee;
  let rate = currentState.rate;
  // Position state
  let updatedPositionState = positionStateLibrary.registerPairSwap(position.current, position, rateOfSwap);
  let swapped = updatedPositionState.swapped.minus(currentState.swapped);
  //
  // Position action
  positionActionLibrary.swapped(positionId, swapped, rate, pairSwap, transaction);
  //
  position.current = updatedPositionState.id;
  position.totalSwapped = position.totalSwapped.plus(swapped);

  if (updatedPositionState.remainingSwaps.equals(ZERO_BI)) {
    position.status = 'COMPLETED';
  }
  position.save();

  return new PositionAndPositionState(position, updatedPositionState);
}

export function transfer(event: Transfer, transaction: Transaction): void {
  let id = event.params.tokenId.toString();
  log.info('[Position] Transfer position {}', [id]);
  let position = Position.load(id);
  if (position != null) {
    position.user = event.params.to as Bytes;
    positionStateLibrary.registerTransfered(position.current);
    positionActionLibrary.transfered(id, event.params.from, event.params.to, transaction);
    position.save();
  }
}

export function permissionsModified(event: PermissionsModified, transaction: Transaction): Position {
  let position = getById(event.params.tokenId.toString());
  let positionState = positionStateLibrary.permissionsModified(position.current, event, transaction);
  positionActionLibrary.permissionsModified(position.id, positionState.permissions, transaction);
  position.current = positionState.id;
  position.save();
  return position;
}

export class PositionAndPositionState {
  _position: Position;
  _positionState: PositionState;

  constructor(position: Position, positionState: PositionState) {
    this._position = position;
    this._positionState = positionState;
  }

  get position(): Position {
    return this._position;
  }

  get positionState(): PositionState {
    return this._positionState;
  }
}
