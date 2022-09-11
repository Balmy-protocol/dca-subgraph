import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as/assembly/index';
import { Deposited, DepositedPermissionsStruct, TokensAllowedUpdated } from '../../generated/Hub/Hub';

export function createTokensAllowedUpdatedEvent(tokens: Array<Address>, allowed: Array<boolean>): TokensAllowedUpdated {
  const newTokensAllowedUpdatedEvent = changetype<TokensAllowedUpdated>(newMockEvent());
  newTokensAllowedUpdatedEvent.parameters = new Array();
  const tokensParm = new ethereum.EventParam('_tokens', ethereum.Value.fromAddressArray(tokens));
  const allowedParam = new ethereum.EventParam('_allowed', ethereum.Value.fromBooleanArray(allowed));

  newTokensAllowedUpdatedEvent.parameters.push(tokensParm);
  newTokensAllowedUpdatedEvent.parameters.push(allowedParam);

  return newTokensAllowedUpdatedEvent;
}

export function createDepositedEvent(
  depositor: Address,
  owner: Address,
  positionId: i32,
  fromToken: Address,
  toToken: Address,
  swapInterval: i32,
  rate: i32,
  startingSwap: i32,
  lastSwap: i32,
  permissions: Array<DepositedPermissionsStruct>
): Deposited {
  const newDepositedEvent = changetype<Deposited>(newMockEvent());
  newDepositedEvent.parameters = new Array();

  newDepositedEvent.parameters.push(new ethereum.EventParam('depositor', ethereum.Value.fromAddress(depositor)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('owner', ethereum.Value.fromAddress(owner)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('positionId', ethereum.Value.fromI32(positionId)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('fromToken', ethereum.Value.fromAddress(fromToken)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('toToken', ethereum.Value.fromAddress(toToken)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('swapInterval', ethereum.Value.fromI32(swapInterval)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('rate', ethereum.Value.fromI32(rate)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('startingSwap', ethereum.Value.fromI32(startingSwap)));
  newDepositedEvent.parameters.push(new ethereum.EventParam('lastSwap', ethereum.Value.fromI32(lastSwap)));
  newDepositedEvent.parameters.push(
    new ethereum.EventParam('permissions', ethereum.Value.fromTupleArray(changetype<ethereum.Tuple[]>(permissions)))
  );
  return newDepositedEvent;
}
