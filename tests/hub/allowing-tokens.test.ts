import { Address, ethereum, BigInt } from '@graphprotocol/graph-ts';
import { clearStore, test, createMockedFunction, assert, newMockEvent } from 'matchstick-as/assembly/index';
import { TokensAllowedUpdated } from '../../generated/Hub/Hub';
import { Token } from '../../generated/schema';
import { handleSetAllowedTokens } from '../../src/mappings/hub';
import { mockTokenContract } from '../utils';

let TOKEN_ENTITY_TYPE = 'Token';
let token1 = '0x0000000000000000000000000000000000000001';

export function createTokensAllowedUpdatedEvent(tokens: Array<Address>, allowed: Array<boolean>): TokensAllowedUpdated {
  let newTokensAllowedUpdatedEvent = changetype<TokensAllowedUpdated>(newMockEvent());
  newTokensAllowedUpdatedEvent.parameters = new Array();
  let tokensParm = new ethereum.EventParam('_tokens', ethereum.Value.fromAddressArray(tokens));
  let allowedParam = new ethereum.EventParam('_allowed', ethereum.Value.fromBooleanArray(allowed));

  newTokensAllowedUpdatedEvent.parameters.push(tokensParm);
  newTokensAllowedUpdatedEvent.parameters.push(allowedParam);

  return newTokensAllowedUpdatedEvent;
}

test('First time tokens are updated', () => {
  mockTokenContract(token1, 'Token 1', 'T1', 15);
  assert.entityCount(TOKEN_ENTITY_TYPE, 0);
  handleSetAllowedTokens(createTokensAllowedUpdatedEvent([Address.fromString(token1)], [true]));
  assert.entityCount(TOKEN_ENTITY_TYPE, 1);
  let token = Token.load(token1)!;
  assert.assertNotNull(token);
  assert.stringEquals(token.name, 'Token 1');
  assert.stringEquals(token.symbol, 'T1');
  assert.assertTrue(token.allowed);
  assert.i32Equals(token.decimals, 15);
  assert.bigIntEquals(token.magnitude, BigInt.fromI32(10).pow(15));
});

test('Token was already allowed and its updated to not allowed', () => {
  handleSetAllowedTokens(createTokensAllowedUpdatedEvent([Address.fromString(token1)], [false]));
  let token = Token.load(token1)!;
  assert.assertNotNull(token);
  assert.assertTrue(!token.allowed);
  clearStore();
});
