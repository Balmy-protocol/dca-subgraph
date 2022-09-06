import { log, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  PairSwap,
  PositionAction,
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
} from '../../generated/schema';
import { ONE_BI, ZERO_BI } from './constants';

export function create(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  permissions: string[],
  transaction: Transaction
): CreatedAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Create {}', [id]);
  let positionAction = CreatedAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<CreatedAction>(createPositionActions(id, 'CREATED', positionId, transaction)) as CreatedAction;
    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.permissions = permissions;
    positionAction.save();
  }
  return positionAction;
}

export function modifiedRate(positionId: string, rate: BigInt, oldRate: BigInt, transaction: Transaction): ModifiedRateAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate {}', [id]);
  let positionAction = ModifiedRateAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<ModifiedRateAction>(createPositionActions(id, 'MODIFIED_RATE', positionId, transaction)) as ModifiedRateAction;
    positionAction.rate = rate;
    positionAction.oldRate = oldRate;
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
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified duration {}', [id]);
  let positionAction = ModifiedDurationAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<ModifiedDurationAction>(
      createPositionActions(id, 'MODIFIED_DURATION', positionId, transaction)
    ) as ModifiedDurationAction;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.oldRemainingSwaps = oldRemainingSwaps;
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
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified rate and duration {}', [id]);
  let positionAction = ModifiedRateAndDurationAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<ModifiedRateAndDurationAction>(
      createPositionActions(id, 'MODIFIED_RATE_AND_DURATION', positionId, transaction)
    ) as ModifiedRateAndDurationAction;
    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.oldRemainingSwaps = oldRemainingSwaps;
    positionAction.oldRate = oldRate;
    positionAction.save();
  }
  return positionAction;
}

export function withdrew(positionId: string, withdrawn: BigInt, transaction: Transaction): WithdrewAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = WithdrewAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<WithdrewAction>(createPositionActions(id, 'WITHDREW', positionId, transaction)) as WithdrewAction;
    positionAction.withdrawn = withdrawn;
    positionAction.save();
  }
  return positionAction;
}

export function terminated(positionId: string, transaction: Transaction): TerminatedAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = TerminatedAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<TerminatedAction>(createPositionActions(id, 'TERMINATED', positionId, transaction)) as TerminatedAction;
    positionAction.save();
  }
  return positionAction;
}

export function swapped(positionId: string, swapped: BigInt, rate: BigInt, pairSwap: PairSwap, transaction: Transaction): SwappedAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Swapped {}', [id]);
  let positionAction = SwappedAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<SwappedAction>(createPositionActions(id, 'SWAPPED', positionId, transaction)) as SwappedAction;
    positionAction.ratePerUnitAToBWithFee = pairSwap.ratePerUnitAToBWithFee;
    positionAction.ratePerUnitBToAWithFee = pairSwap.ratePerUnitBToAWithFee;
    positionAction.swapped = swapped;
    positionAction.rate = rate;
    positionAction.save();
  }
  return positionAction;
}

export function transfered(positionId: string, from: Address, to: Address, transaction: Transaction): TransferedAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Transfered {}', [id]);
  let positionAction = TransferedAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<TransferedAction>(createPositionActions(id, 'TRANSFERED', positionId, transaction)) as TransferedAction;
    positionAction.from = from;
    positionAction.to = to;
    positionAction.save();
  }
  return positionAction;
}

export function permissionsModified(positionId: string, permissions: string[], transaction: Transaction): PermissionsModifiedAction {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Permissions modified {}', [id]);
  let positionAction = PermissionsModifiedAction.load(id);
  if (positionAction == null) {
    positionAction = changetype<PermissionsModifiedAction>(
      createPositionActions(id, 'PERMISSIONS_MODIFIED', positionId, transaction)
    ) as PermissionsModifiedAction;
    positionAction.permissions = permissions;
    positionAction.save();
  }
  return positionAction;
}

function createPositionActions(id: string, positionId: string, action: string, transaction: Transaction): PositionAction {
  log.debug('[PositionAction] Create basic position action {}', [id]);
  let positionAction = new PositionAction(id);
  positionAction.position = positionId;
  positionAction.action = action;
  positionAction.actor = transaction.from;

  positionAction.transaction = transaction.id;
  positionAction.createdAtBlock = transaction.blockNumber;
  positionAction.createdAtTimestamp = transaction.timestamp;
  return positionAction;
}
