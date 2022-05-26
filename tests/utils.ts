import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as/assembly/index';

export function mockTokenContract(address: string, name: string, symbol: string, decimals: i32): void {
  createMockedFunction(Address.fromString(address), 'name', 'name():(string)')
    .withArgs([])
    .returns([ethereum.Value.fromString(name)]);
  createMockedFunction(Address.fromString(address), 'symbol', 'symbol():(string)')
    .withArgs([])
    .returns([ethereum.Value.fromString(symbol)]);

  createMockedFunction(Address.fromString(address), 'decimals', 'decimals():(uint8)')
    .withArgs([])
    .returns([ethereum.Value.fromI32(decimals)]);
}
