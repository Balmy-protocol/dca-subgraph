import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import {
  PairSwap,
  PermissionsModifiedAction,
  TransferedAction,
  Transaction,
  SwappedAction,
  TerminatedAction,
  WithdrewAction,
  CreatedAction,
  ModifiedRateAction,
  ModifiedDurationAction,
  ModifiedRateAndDurationAction,
  Position,
} from '../../generated/schema';
import { ONE_BI } from './constants';
import * as tokenLibrary from '../utils/token';

export function create(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  permissions: string[],
  transaction: Transaction
): CreatedAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Create {}', [id]);
  let positionAction = CreatedAction.load(id);
  if (positionAction == null) {
    positionAction = new CreatedAction(id);
    positionAction.position = positionId;
    positionAction.action = 'CREATED';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.permissions = permissions;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedRate(positionId: string, rate: BigInt, oldRate: BigInt, transaction: Transaction): ModifiedRateAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate {}', [id]);
  let positionAction = ModifiedRateAction.load(id);
  if (positionAction == null) {
    positionAction = new ModifiedRateAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_RATE';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.oldRate = oldRate;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedDuration(
  positionId: string,
  startingSwap: BigInt,
  lastSwap: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): ModifiedDurationAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified duration {}', [id]);
  let positionAction = ModifiedDurationAction.load(id);
  if (positionAction == null) {
    positionAction = new ModifiedDurationAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_DURATION';
    positionAction.actor = transaction.from;

    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.oldRemainingSwaps = oldRemainingSwaps;

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
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  transaction: Transaction
): ModifiedRateAndDurationAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate and duration {}', [id]);
  let positionAction = ModifiedRateAndDurationAction.load(id);
  if (positionAction == null) {
    positionAction = new ModifiedRateAndDurationAction(id);
    positionAction.position = positionId;
    positionAction.action = 'MODIFIED_RATE_AND_DURATION';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.oldRemainingSwaps = oldRemainingSwaps;
    positionAction.oldRate = oldRate;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function withdrew(positionId: string, withdrawn: BigInt, transaction: Transaction): WithdrewAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = WithdrewAction.load(id);
  if (positionAction == null) {
    positionAction = new WithdrewAction(id);
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

export function terminated(positionId: string, transaction: Transaction): TerminatedAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = TerminatedAction.load(id);
  if (positionAction == null) {
    positionAction = new TerminatedAction(id);
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

export function swapped(position: Position, swapped: BigInt, rate: BigInt, pairSwap: PairSwap, transaction: Transaction): SwappedAction {
  const id = position.id.concat('-').concat(transaction.id);
  const from = tokenLibrary.getById(position.from);
  const to = tokenLibrary.getById(position.to);
  log.info('[PositionAction] Swapped {}', [id]);
  let positionAction = SwappedAction.load(id);
  if (positionAction == null) {
    positionAction = new SwappedAction(id);
    positionAction.position = position.id;
    positionAction.action = 'SWAPPED';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.swapped = swapped;

    positionAction.ratioPerUnitAToBWithFeeApplied = pairSwap.ratioPerUnitAToBWithFeeApplied;
    positionAction.ratioPerUnitBToAWithFeeApplied = pairSwap.ratioPerUnitBToAWithFeeApplied;

    // Check yield-bearing-share on from
    if (from.type == 'YIELD_BEARING_SHARE') {
      positionAction.depositedRateUnderlying = position.depositedRateUnderlying;
    }

    // Check yield-bearing-share on to
    if (to.type == 'YIELD_BEARING_SHARE') {
      positionAction.swappedUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(position.to), swapped);
    }

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function transfered(positionId: string, from: Address, to: Address, transaction: Transaction): TransferedAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Transfered {}', [id]);
  let positionAction = TransferedAction.load(id);
  if (positionAction == null) {
    positionAction = new TransferedAction(id);
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

export function permissionsModified(positionId: string, permissions: string[], transaction: Transaction): PermissionsModifiedAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Permissions modified {}', [id]);
  let positionAction = PermissionsModifiedAction.load(id);
  if (positionAction == null) {
    positionAction = new PermissionsModifiedAction(id);
    positionAction.position = positionId;
    positionAction.action = 'PERMISSIONS_MODIFIED';
    positionAction.actor = transaction.from;

    positionAction.permissions = permissions;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}
