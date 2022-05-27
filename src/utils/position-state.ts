import { log, BigInt, Bytes, store } from '@graphprotocol/graph-ts';
import { DepositedPermissionsStruct } from '../../generated/Hub/Hub';
import { Position, PositionPermission, PositionState, Transaction } from '../../generated/schema';
import { Modified as PermissionsModified } from '../../generated/PermissionsManager/PermissionsManager';
import { ONE_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';
import * as permissionsLibrary from './permissions';

// Creates position state  with zero-ed values.
export function createBasic(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  permissions: permissionsLibrary.CommonPermissionsStruct[],
  transaction: Transaction
): PositionState {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionState] Create basic {}', [id]);
  let positionState = PositionState.load(id);
  if (positionState == null) {
    positionState = new PositionState(id);
    positionState.position = positionId;

    let createdPermissions = permissionsLibrary.createFromCommonPermissionsStruct(id, permissions);
    positionState.permissions = createdPermissions;

    positionState.rate = rate;
    positionState.startingSwap = startingSwap;
    positionState.lastSwap = lastSwap;

    positionState.remainingSwaps = lastSwap.minus(startingSwap).plus(ONE_BI);
    positionState.swapped = ZERO_BI;
    positionState.idleSwapped = ZERO_BI;
    positionState.withdrawn = ZERO_BI;
    positionState.remainingLiquidity = rate.times(positionState.remainingSwaps);

    positionState.swappedBeforeModified = ZERO_BI;
    positionState.rateAccumulator = ZERO_BI;

    positionState.transaction = transaction.id;
    positionState.createdAtBlock = transaction.blockNumber;
    positionState.createdAtTimestamp = transaction.timestamp;
    positionState.save();
  }
  return positionState;
}

// Creates a position state were all values are zero-ed except for idleSwapped and swappedBeforeModified. Only used when
// position was modified
export function createComposed(
  positionId: string,
  rate: BigInt,
  startingSwap: BigInt,
  lastSwap: BigInt,
  swappedBeforeModified: BigInt,
  permissions: string[],
  transaction: Transaction
): PositionState {
  let id = positionId.concat('-').concat(transaction.id);
  log.info('[PositionState] Create composed {}', [id]);
  let positionState = createBasic(positionId, rate, startingSwap, lastSwap, [], transaction);
  positionState.idleSwapped = swappedBeforeModified;
  positionState.swappedBeforeModified = swappedBeforeModified;
  // duplicate permissions
  let duplicatedPermissions = permissionsLibrary.duplicatePermissionsToPositionState(id, permissions).permissionsIds;
  positionState.permissions = duplicatedPermissions;
  //
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
  positionState.idleSwapped = ZERO_BI;
  positionState.withdrawn = positionState.withdrawn.plus(positionState.idleSwapped);
  positionState.remainingLiquidity = ZERO_BI;

  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}

export function registerWithdrew(id: string, withdrawn: BigInt): PositionState {
  log.info('[PositionState] Register withdrew {}', [id]);
  let positionState = get(id);
  positionState.idleSwapped = positionState.idleSwapped.minus(withdrawn);
  positionState.withdrawn = positionState.withdrawn.plus(withdrawn);
  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}

export function registerTransfered(id: string): PositionState {
  log.info('[PositionState] Register transfered {}', [id]);
  let positionState = get(id);
  positionState.permissions = [];
  positionState.save();
  return positionState;
}

export function registerPairSwap(id: string, position: Position, ratio: BigInt): PositionState {
  log.info('[PositionState] Register pair swap {}', [id]);
  let positionState = get(id);
  let from = tokenLibrary.getById(position.from);

  positionState.rateAccumulator = positionState.rateAccumulator.plus(ratio);

  let augmentedSwapped = positionState.rateAccumulator.times(positionState.rate);
  let totalSwapped = augmentedSwapped.div(from.magnitude);

  positionState.swapped = positionState.swappedBeforeModified.plus(totalSwapped);
  positionState.idleSwapped = positionState.swapped.minus(positionState.withdrawn);

  positionState.remainingSwaps = positionState.remainingSwaps.minus(ONE_BI);
  positionState.remainingLiquidity = positionState.remainingLiquidity.minus(positionState.rate);

  // TODO: lastUpdatedAt
  positionState.save();
  return positionState;
}

export function permissionsModified(currentPositionStateId: string, event: PermissionsModified, transaction: Transaction): string[] {
  log.info('[PositionState] Permissions modified {}', [currentPositionStateId]);
  let currentPositionState = get(currentPositionStateId);

  let newPositionPermissionsIds: string[] = currentPositionState.permissions;
  let positionPermissions: PositionPermission[] = [];
  for (let i: i32 = 0; i < currentPositionState.permissions.length; i++) {
    let permission = permissionsLibrary.get(currentPositionState.permissions[i]);
    positionPermissions.push(permission);
  }

  let modifiedPermissions: string[] = [];

  // We iterate over every modification
  // O(n)
  for (let i: i32 = 0; i < event.params.permissions.length; i++) {
    // Find modified permission in previous permissions
    let j = 0;
    while (j < currentPositionState.permissions.length && event.params.permissions[i].operator != (positionPermissions[j].operator as Bytes)) {
      j++;
    }

    let foundPermission = j < positionPermissions.length;
    if (foundPermission) {
      modifiedPermissions.push(positionPermissions[j].id);
      if (event.params.permissions[i].permissions.length > 0) {
        // If new permissions.length > 0 => we update that operators permissions
        let permissions: string[] = [];
        for (let k: i32 = 0; k < event.params.permissions[i].permissions.length; k++) {
          // O(1)
          permissions.push(permissionsLibrary.permissionByIndex[event.params.permissions[i].permissions[k]]);
        }
        positionPermissions[j].permissions = permissions;
        positionPermissions[j].save();
      } else {
        // If new permission.length == 0 => Operator has no permissions => Remove position from permissions array and set it empty
        // so position action can read from it
        // TODO: Delete positionPermissions[i] from storage of subgraph
        positionPermissions[j].permissions = [];
        positionPermissions[j].save();
        newPositionPermissionsIds.splice(newPositionPermissionsIds.indexOf(positionPermissions[j].id), 1);
      }
    } else {
      // If emitted modification is not on a already created permission => create permission
      let permission = permissionsLibrary.createFromCommonPermissionsStruct(
        currentPositionState.id,
        permissionsLibrary.convertModifiedPermissionStructToCommon([event.params.permissions[i]])
      );
      modifiedPermissions.push(permission[0]);
      newPositionPermissionsIds.push(permission[0]);
    }
  }

  currentPositionState.permissions = newPositionPermissionsIds;
  currentPositionState.save();

  return modifiedPermissions;
}

export class PositionStateAndModifiedPermissions {
  _positionState: PositionState;
  _modifiedPermissions: string[];

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
