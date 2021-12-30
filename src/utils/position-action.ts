import { log, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import { PairSwap, PositionAction, Transaction } from '../../generated/schema';
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

export function modifiedRate(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): PositionAction {
  return handleModifiedRateOrDuration('MODIFIED_RATE', positionId, rate, startingSwap, lastSwap, oldRate, oldRemainingSwaps, transaction);
}

export function modifiedDuration(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): PositionAction {
  return handleModifiedRateOrDuration('MODIFIED_DURATION', positionId, rate, startingSwap, lastSwap, oldRate, oldRemainingSwaps, transaction);
}

export function modifiedRateAndDuration(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): PositionAction {
  return handleModifiedRateOrDuration(
    'MODIFIED_RATE_AND_DURATION',
    positionId,
    rate,
    startingSwap,
    lastSwap,
    oldRate,
    oldRemainingSwaps,
    transaction
  );
}

function handleModifiedRateOrDuration(
  action: string,
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate and duration {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = action;
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.oldRate = oldRate;
    positionAction.oldRemainingSwaps = oldRemainingSwaps;

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

export function terminated(positionId: string, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'TERMINATED';
    positionAction.actor = transaction.from;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function swapped(positionId: string, swapped: BigInt, rate: BigInt, pairSwap: PairSwap, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Swapped {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'SWAPPED';
    positionAction.actor = transaction.from;
    positionAction.ratePerUnitAToBWithFee = pairSwap.ratePerUnitAToBWithFee;
    positionAction.ratePerUnitBToAWithFee = pairSwap.ratePerUnitBToAWithFee;

    positionAction.swapped = swapped;
    positionAction.rate = rate;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function transfered(positionId: string, from: Address, to: Address, transaction: Transaction): PositionAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Transfered {}', [id]);
  let positionAction = PositionAction.load(id);
  if (positionAction == null) {
    positionAction = new PositionAction(id);
    positionAction.position = positionId;
    positionAction.action = 'TRANSFERED';
    positionAction.actor = transaction.from;
    positionAction.from = from;
    positionAction.to = to;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}
