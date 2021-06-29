import { log } from '@graphprotocol/graph-ts';
import { Transaction, Position } from '../../generated/schema';
import { Deposited, Modified, Terminated } from '../../generated/Factory/Pair';
import * as pairLibrary from './pair';
import * as positionStateLibrary from './position-state';
import * as tokenLibrary from './token';

export function create(event: Deposited, transaction: Transaction): Position {
  let id = event.params._dcaId.toString();
  log.warning('[Position] Create {}', [id]);
  let position = Position.load(id);
  let pair = pairLibrary.get(event.transaction.to.toHexString());
  let from = tokenLibrary.getOrCreate(event.params._fromToken);
  if (position == null) {
    position = new Position(id);
    position.from = from.id;
    position.to = position.from == pair.token0 ? pair.token1 : pair.token0;
    position.pair = pair.id;
    position.swapInterval = event.params._swapInterval.toString();
    position.status = 'ACTIVE';
    position.transaction = transaction.id;
    position.createdAtBlock = transaction.blockNumber;
    position.createdAtTimestamp = transaction.timestamp;

    // Create position state
    let positionState = positionStateLibrary.create(id, event.params._rate, event.params._startingSwap, event.params._lastSwap, transaction);
    position.current = positionState.id;
    position.save();
  }
  return position!;
}

export function modified(event: Modified, transaction: Transaction): Position {
  let id = event.params._dcaId.toString();
  log.warning('[Position] Modified {}', [id]);
  let position = Position.load(id);
  let positionState = positionStateLibrary.create(id, event.params._rate, event.params._startingSwap, event.params._lastSwap, transaction);
  position.current = positionState.id;
  position.save();
  return position!;
}

export function terminated(event: Terminated, transaction: Transaction): Position {
  let id = event.params._dcaId.toString();
  log.warning('[Position] Terminated {}', [id]);
  let position = Position.load(id);
  position.status = 'TERMINATED';
  position.terminatedAtBlock = transaction.blockNumber;
  position.terminatedAtTimestamp = transaction.timestamp;
  position.save();
  return position!;
}