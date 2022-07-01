import { Address, Bytes, log, store } from '@graphprotocol/graph-ts';
import { DepositedPermissionsStruct } from '../../generated/Hub/Hub';
import { ModifiedPermissionsStruct } from '../../generated/PermissionsManager/PermissionsManager';
import { PositionPermission, Transaction, Position } from '../../generated/schema';
import * as positionLibrary from './position';
import { Modified } from '../../generated/PermissionsManager/PermissionsManager';

export let permissionByIndex = ['INCREASE', 'REDUCE', 'WITHDRAW', 'TERMINATE'];

export function get(id: string): PositionPermission {
  log.info('[PositionPermission] Get {}', [id]);
  let positionPermission = PositionPermission.load(id);
  if (positionPermission == null) throw Error('PositionPermission not found');
  return positionPermission;
}

export function deleteAll(positionPermissions: string[]): void {
  log.info('[PositionPermission] Delete all {} permissions', [positionPermissions.length.toString()]);
  for (let i: i32 = 0; i < positionPermissions.length; i++) {
    store.remove('PositionPermission', positionPermissions[i]);
  }
}

export function permissionsModified(positionId: string, event: Modified): NewAndModifiedPermissionsIds {
  log.info('[PositionPermission] Permissions modified {}', [positionId]);
  let position = positionLibrary.getById(positionId);

  let newPositionPermissionsIds: string[] = position.permissions;
  let positionPermissions: PositionPermission[] = [];
  for (let i: i32 = 0; i < position.permissions.length; i++) {
    let permission = get(position.permissions[i]);
    positionPermissions.push(permission);
  }

  let modifiedPermissions: string[] = [];

  // We iterate over every modification
  // O(n)
  for (let i: i32 = 0; i < event.params.permissions.length; i++) {
    // Find modified permission in previous permissions
    let j = 0;
    while (j < position.permissions.length && event.params.permissions[i].operator != (positionPermissions[j].operator as Bytes)) {
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
          permissions.push(permissionByIndex[event.params.permissions[i].permissions[k]]);
        }
        positionPermissions[j].permissions = permissions;
        positionPermissions[j].save();
      } else {
        // If new permission.length == 0 => Operator has no permissions => Remove position from permissions array and set it empty
        // so position action can read from it
        newPositionPermissionsIds.splice(newPositionPermissionsIds.indexOf(positionPermissions[j].id), 1);
        store.remove('PositionPermission', positionPermissions[j].id);
      }
    } else {
      // If emitted modification is not on a already created permission => create permission
      let permission = createFromModifiedPermissionsStruct(position.id, [event.params.permissions[i]]);
      modifiedPermissions.push(permission[0]);
      newPositionPermissionsIds.push(permission[0]);
    }
  }

  return new NewAndModifiedPermissionsIds(newPositionPermissionsIds, modifiedPermissions);
}

export function createFromDepositedPermissionsStruct(positionId: string, permissionSet: DepositedPermissionsStruct[]): string[] {
  return createFromCommonPermissionsStruct(positionId, convertDepositedPermissionStructToCommon(permissionSet));
}

export function createFromModifiedPermissionsStruct(positionId: string, permissionSet: ModifiedPermissionsStruct[]): string[] {
  return createFromCommonPermissionsStruct(positionId, convertModifiedPermissionStructToCommon(permissionSet));
}

// Creates all permissions from deposited permissions struct
export function createFromCommonPermissionsStruct(positionId: string, permissionSet: CommonPermissionsStruct[]): string[] {
  log.info('[Permissions] Create from deposited {}', [positionId]);
  let positionPermissionsIds: string[] = [];
  for (let i: i32 = 0; i < permissionSet.length; i++) {
    let positionPermissionId = positionId.concat('-').concat(permissionSet[i].operator.toHexString());
    let positionPermission = new PositionPermission(positionPermissionId);
    positionPermission.operator = permissionSet[i].operator as Bytes;
    let permissions: string[] = [];
    for (let x: i32 = 0; x < permissionSet[i].permissions.length; x++) {
      permissions.push(permissionByIndex[permissionSet[i].permissions[x]]);
    }
    positionPermission.permissions = permissions;
    positionPermission.save();
    positionPermissionsIds.push(positionPermissionId);
  }
  return positionPermissionsIds;
}

// Since thegraph is pretty limited and we can't cast it when needed, we need this convertion function
export function convertDepositedPermissionStructToCommon(permissionSet: DepositedPermissionsStruct[]): CommonPermissionsStruct[] {
  let commonPermissionSet: CommonPermissionsStruct[] = [];
  for (let i: i32 = 0; i < permissionSet.length; i++) {
    commonPermissionSet.push(new CommonPermissionsStruct(permissionSet[i].operator, permissionSet[i].permissions));
  }
  return commonPermissionSet;
}

// Since thegraph is pretty limited and we can't cast it when needed, we need this convertion function
export function convertModifiedPermissionStructToCommon(permissionSet: ModifiedPermissionsStruct[]): CommonPermissionsStruct[] {
  let commonPermissionSet: CommonPermissionsStruct[] = [];
  for (let i: i32 = 0; i < permissionSet.length; i++) {
    commonPermissionSet.push(new CommonPermissionsStruct(permissionSet[i].operator, permissionSet[i].permissions));
  }
  return commonPermissionSet;
}

// We create our own type of permissions struct because thegraph is impossible.
export class CommonPermissionsStruct {
  private _operator: Address;
  private _permissions: i32[];

  constructor(operator: Address, permissions: i32[]) {
    this._operator = operator;
    this._permissions = permissions;
  }

  get operator(): Address {
    return this._operator;
  }

  get permissions(): i32[] {
    return this._permissions;
  }
}

export class NewAndModifiedPermissionsIds {
  private _newPermissions: string[];
  private _modified: string[];

  constructor(newPermissions: string[], modified: string[]) {
    this._newPermissions = newPermissions;
    this._modified = modified;
  }

  get newPermissions(): string[] {
    return this._newPermissions;
  }

  get modified(): string[] {
    return this._modified;
  }
}
