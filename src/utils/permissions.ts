import { Bytes, log } from '@graphprotocol/graph-ts';
import { DepositedPermissionsStruct } from '../../generated/Hub/Hub';
import { PositionPermission } from '../../generated/schema';

let permissionByIndex = ['INCREASE', 'REDUCE', 'WITHDRAW', 'TERMINATE'];

export function get(id: string): PositionPermission {
  log.info('[PositionPermission] Get {}', [id]);
  let positionPermission = PositionPermission.load(id);
  if (positionPermission == null) throw Error('PositionPermission not found');
  return positionPermission;
}

export function createFromDepositedPermissionsStruct(positionStateId: string, permissionSet: DepositedPermissionsStruct[]): string[] {
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

export function duplicatePermissionsToPositionState(positionStateId: string, permissionsToDuplicate: string[]): string[] {
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
  }
  return positionPermissionsIds;
}
