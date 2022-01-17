import { Address, Bytes, log } from '@graphprotocol/graph-ts';
import { DepositedPermissionsStruct } from '../../generated/Hub/Hub';
import { ModifiedPermissionsStruct } from '../../generated/PermissionsManager/PermissionsManager';
import { PositionPermission } from '../../generated/schema';

export let permissionByIndex = ['INCREASE', 'REDUCE', 'WITHDRAW', 'TERMINATE'];

export function get(id: string): PositionPermission {
  log.info('[PositionPermission] Get {}', [id]);
  let positionPermission = PositionPermission.load(id);
  if (positionPermission == null) throw Error('PositionPermission not found');
  return positionPermission;
}

// Creates all permissions from deposited permissions struct
export function createFromCommonPermissionsStruct(positionStateId: string, permissionSet: CommonPermissionsStruct[]): string[] {
  log.info('[Permissions] Create from deposited {}', [positionStateId]);
  let positionPermissionsIds: string[] = [];
  for (let i: i32 = 0; i < permissionSet.length; i++) {
    let positionPermissionId = positionStateId.concat('-').concat(permissionSet[i].operator.toHexString());
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

// It will duplicate all given permissions and create permissions that have on their ids the provided position state
export function duplicatePermissionsToPositionState(positionStateId: string, permissionsToDuplicate: string[]): PermissionsAndIds {
  let positionPermissions: PositionPermission[] = [];
  let positionPermissionsIds: string[] = [];
  for (let i: i32 = 0; i < permissionsToDuplicate.length; i++) {
    let permission = get(permissionsToDuplicate[i]);
    let duplicatedPossitionPermissionId = positionStateId.concat('-').concat(permission.operator.toHexString());
    let duplicatedPossitionPermission = new PositionPermission(duplicatedPossitionPermissionId);
    duplicatedPossitionPermission.operator = permission.operator as Bytes;
    let permissions: string[] = [];
    for (let x: i32 = 0; x < permission.permissions.length; x++) {
      permissions.push(permission.permissions[x]);
    }
    duplicatedPossitionPermission.permissions = permissions;
    duplicatedPossitionPermission.save();
    positionPermissionsIds.push(duplicatedPossitionPermissionId);
    positionPermissions.push(duplicatedPossitionPermission);
  }
  return new PermissionsAndIds(positionPermissions, positionPermissionsIds);
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

export class PermissionsAndIds {
  private _permissions: PositionPermission[];
  private _permissionsIds: string[];

  constructor(permissions: PositionPermission[], permissionsIds: string[]) {
    this._permissions = permissions;
    this._permissionsIds = permissionsIds;
  }

  get permissions(): PositionPermission[] {
    return this._permissions;
  }

  get permissionsIds(): string[] {
    return this._permissionsIds;
  }
}
