import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as/assembly/index';
import { Token } from '../../generated/schema';

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

export function createToken(
  tokenAddress: Address,
  name: string,
  symbol: string,
  decimals: i32,
  allowed: boolean,
  type: string,
  underlyingTokens: string[] | null,
): void {
  const token = new Token(tokenAddress.toHexString());
  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;
  token.magnitude = BigInt.fromI32(10).pow(decimals as u8);
  token.allowed = allowed;
  token.type = type;
  if (underlyingTokens != null) {
    token.underlyingTokens = underlyingTokens;
  }
  token.save();
}
