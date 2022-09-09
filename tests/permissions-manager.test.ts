import { Address, ethereum, BigInt, log, Bytes, Value } from '@graphprotocol/graph-ts';
import { clearStore, test, createMockedFunction, assert, newMockEvent } from 'matchstick-as/assembly/index';
import { DepositedPermissionsStruct, TokensAllowedUpdated } from '../generated/Hub/Hub';
import { Position, PositionPermission, Token } from '../generated/schema';
import { handleDeposited, handleSetAllowedTokens } from '../src/mappings/hub';
import { ADDRESS_ZERO } from '../src/utils/constants';
import { createDepositedEvent, createTokensAllowedUpdatedEvent } from './test-utils/event-utils';
import { mockTokenContract } from './test-utils/token';
import { MockTransformerRegistry } from './test-utils/transformer-registry';

let PERMISSION_ENTITY_TYPE = 'PositionPermission';
let user = '0x4200000000000000000000000000000000000069';
let token1 = '0x0000000000000000000000000000000000000001';
let token2 = '0x0000000000000000000000000000000000000002';

test('Deposit with empty permissions doesnt create permissions', () => {
  mockTokenContract(token1, 'Token 1', 'T1', 15);
  MockTransformerRegistry.transformers([Address.fromString(token1)], [ADDRESS_ZERO]);
  mockTokenContract(token2, 'Token 2', 'T2', 16);
  MockTransformerRegistry.transformers([Address.fromString(token2)], [ADDRESS_ZERO]);
  handleSetAllowedTokens(createTokensAllowedUpdatedEvent([Address.fromString(token1), Address.fromString(token2)], [true, true]));
  handleDeposited(
    createDepositedEvent(
      Address.fromString(user),
      Address.fromString(user),
      1, // id
      Address.fromString(token1),
      Address.fromString(token2),
      9999,
      0,
      0,
      0,
      []
    )
  );
  let position = Position.load('1')!;
  assert.equals(ethereum.Value.fromStringArray(position.permissions), ethereum.Value.fromArray([]));
  assert.entityCount(PERMISSION_ENTITY_TYPE, 0);
});

let operator = '0x4200000000000000000000000000000000000096';

test('Deposit with permissions creates the correct permissions', () => {
  let permissionStruct = new DepositedPermissionsStruct();
  permissionStruct.push(ethereum.Value.fromAddress(Address.fromString(operator)));
  permissionStruct.push(ethereum.Value.fromI32Array([0]));
  handleDeposited(
    createDepositedEvent(
      Address.fromString(user),
      Address.fromString(user),
      2, // id
      Address.fromString(token1),
      Address.fromString(token2),
      9999,
      0,
      0,
      0,
      [permissionStruct]
    )
  );
  let position = Position.load('2')!;
  let positionPermissionId = position.id.concat('-').concat(operator);
  assert.equals(
    ethereum.Value.fromStringArray(position.permissions),
    ethereum.Value.fromArray([ethereum.Value.fromString(positionPermissionId)])
  );
  assert.entityCount(PERMISSION_ENTITY_TYPE, 1);
  let permission = PositionPermission.load(positionPermissionId)!;
  assert.assertNotNull(permission);
  assert.bytesEquals(permission.operator, Bytes.fromHexString(operator));
  assert.i32Equals(permission.permissions.length, 1);
  assert.stringEquals(permission.permissions[0], 'INCREASE');
});

// test('Adds permission to already existing one, doesnt create new entity', () => {});

// test('Deleting all permissions of a user from a position, deletes entity', () => {});

// test('Transferring a position resets all their permissions', () => {});
