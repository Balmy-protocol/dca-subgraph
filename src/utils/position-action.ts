import { log, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import {
  PairSwap,
  PermissionsModifiedAction,
  TransferedAction,
  Transaction,
  SwappedAction,
  TerminatedAction,
  WithdrewAction,
  CreatedAction,
  ModifiedAction,
  Position,
} from '../../generated/schema';
import { ONE_BI } from './constants';
import * as tokenLibrary from '../utils/token';

export function create(
  positionId: string,
  rate: BigInt,
  rateUnderlying: BigInt | null,
  startingSwap: BigInt,
  lastSwap: BigInt,
  permissions: string[],
  owner: Bytes,
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
    positionAction.owner = owner;
    positionAction.rate = rate;
    positionAction.rateUnderlying = rateUnderlying;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.permissions = permissions;

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
  rateUnderlying: BigInt | null,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  oldRateUnderlying: BigInt | null,
  transaction: Transaction
): ModifiedAction {
  return handleModifiedRateOrDuration(
    'MODIFIED_RATE',
    positionId,
    rate,
    startingSwap,
    lastSwap,
    rateUnderlying,
    oldRate,
    oldRemainingSwaps,
    oldRateUnderlying,
    transaction
  );
}

export function modifiedDuration(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  rateUnderlying: BigInt | null,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  oldRateUnderlying: BigInt | null,
  transaction: Transaction
): ModifiedAction {
  return handleModifiedRateOrDuration(
    'MODIFIED_DURATION',
    positionId,
    rate,
    startingSwap,
    lastSwap,
    rateUnderlying,
    oldRate,
    oldRemainingSwaps,
    oldRateUnderlying,
    transaction
  );
}

export function modifiedRateAndDuration(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  rateUnderlying: BigInt | null,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  oldRateUnderlying: BigInt | null,
  transaction: Transaction
): ModifiedAction {
  return handleModifiedRateOrDuration(
    'MODIFIED_RATE_AND_DURATION',
    positionId,
    rate,
    startingSwap,
    lastSwap,
    rateUnderlying,
    oldRate,
    oldRemainingSwaps,
    oldRateUnderlying,
    transaction
  );
}

function handleModifiedRateOrDuration(
  action: string,
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  rateUnderlying: BigInt | null,
  oldRate: BigInt,
  oldRemainingSwaps: BigInt,
  oldRateUnderlying: BigInt | null,
  transaction: Transaction
): ModifiedAction {
  const id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionAction] Modified action with id {}', [id]);
  let positionAction = ModifiedAction.load(id);
  if (positionAction == null) {
    positionAction = new ModifiedAction(id);
    positionAction.position = positionId;
    positionAction.action = action;
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionAction.rateUnderlying = rateUnderlying;
    positionAction.oldRate = oldRate;
    positionAction.oldRemainingSwaps = oldRemainingSwaps;
    positionAction.oldRateUnderlying = oldRateUnderlying;

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function withdrew(
  position: Position,
  withdrawn: BigInt,
  withdrawnUnderlyingAccum: BigInt | null,
  transaction: Transaction
): WithdrewAction {
  const id = position.id.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  const to = tokenLibrary.getById(position.to);
  let positionAction = WithdrewAction.load(id);
  if (positionAction == null) {
    positionAction = new WithdrewAction(id);
    positionAction.position = position.id;
    positionAction.action = 'WITHDREW';
    positionAction.actor = transaction.from;

    positionAction.withdrawn = withdrawn;
    if (to.type == 'YIELD_BEARING_SHARE') {
      positionAction.withdrawnUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(position.to), withdrawn);
      positionAction.withdrawnUnderlyingAccum = withdrawnUnderlyingAccum;
    }

    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;
    positionAction.save();
  }
  return positionAction;
}

export function terminated(
  position: Position,
  withdrawnSwapped: BigInt,
  withdrawnRemaining: BigInt,
  remainingSwaps: BigInt,
  withdrawnUnderlyingAccum: BigInt | null,
  transaction: Transaction
): TerminatedAction {
  const id = position.id.concat('-').concat(transaction.id);
  log.info('[PositionAction] Withdrew {}', [id]);
  let positionAction = TerminatedAction.load(id);
  if (positionAction == null) {
    const to = tokenLibrary.getById(position.to);
    const from = tokenLibrary.getById(position.from);
    positionAction = new TerminatedAction(id);
    positionAction.position = position.id;
    positionAction.action = 'TERMINATED';
    positionAction.actor = transaction.from;
    positionAction.transaction = transaction.id;
    positionAction.createdAtBlock = transaction.blockNumber;
    positionAction.createdAtTimestamp = transaction.timestamp;

    positionAction.withdrawnSwapped = withdrawnSwapped;
    positionAction.withdrawnRemaining = withdrawnRemaining;
    if (to.type == 'YIELD_BEARING_SHARE') {
      positionAction.withdrawnSwappedUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(
        Address.fromString(position.to),
        withdrawnSwapped
      );
      positionAction.withdrawnUnderlyingAccum = withdrawnUnderlyingAccum;
    }
    if (from.type == 'YIELD_BEARING_SHARE') {
      positionAction.withdrawnRemainingUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(
        Address.fromString(position.from),
        withdrawnRemaining
      );
      positionAction.depositedRemainingUnderlying = position.depositedRateUnderlying!.times(remainingSwaps);
    }
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
    positionAction.pairSwap = pairSwap.id;
    positionAction.action = 'SWAPPED';
    positionAction.actor = transaction.from;

    positionAction.rate = rate;
    positionAction.swapped = swapped;

    // Check yield-bearing-share on from
    if (from.type == 'YIELD_BEARING_SHARE') {
      positionAction.depositedRateUnderlying = position.depositedRateUnderlying;
      positionAction.rateUnderlying = tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(position.from), rate);
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
