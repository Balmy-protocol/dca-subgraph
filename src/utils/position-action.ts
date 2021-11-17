import { log, BigInt } from '@graphprotocol/graph-ts';
import { PositionAction, Transaction } from '../../generated/schema';
import { ONE_BI, ZERO_BI } from './constants';

export function create(positionId: string, rate: BigInt, startingSwap: BigInt, lastSwap: BigInt, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Create {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'CREATED';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedRate(positionId: string, rate: BigInt, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_RATE';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedDuration(positionId: string, startingSwap: BigInt, lastSwap: BigInt, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified duration {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_DURATION';
    positionAction.actor = transaction.from;

    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedRateAndDuration(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  transaction: Transaction
): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate and duration {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_RATE_AND_DURATION';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function withdrew(positionId: string, withdrawn: BigInt, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'WITHDREW';
    positionAction.actor = transaction.from;

    positionAction.withdrawn = withdrawn;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function swapped(positionId: string, swapped: BigInt, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Swapped {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'SWAPPED';
    positionAction.actor = transaction.from;

    positionAction.swapped = swapped;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}
