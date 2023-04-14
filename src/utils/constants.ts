import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000');
export const PROTOCOL_TOKEN_ADDRESS = Address.fromString('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
export const HUB_ADDRESS = Address.fromString('0xA5AdC5484f9997fBF7D405b9AA62A7d88883C345');

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const TWO_BI = BigInt.fromI32(2);
export const ZERO_BD = BigDecimal.fromString('0');
export const ONE_BD = BigDecimal.fromString('1');
export const BI_18 = BigInt.fromI32(18);
export const MAX_BI = BigInt.fromString('115792089237316195423570985008687907853269984665640564039457584007913129639935');

export function getKnown4626(): Map<string, Array<Address>> {
  const KNOWN_4626 = new Map<string, Array<Address>>();
  KNOWN_4626.set('mainnet', new Array<Address>());
  KNOWN_4626.set('optimism', new Array<Address>());
  KNOWN_4626.set('arbitrum-one', new Array<Address>());
  KNOWN_4626.set('matic', new Array<Address>());
  return KNOWN_4626;
}
