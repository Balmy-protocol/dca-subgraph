import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts';

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000').toHexString();
export const PROTOCOL_TOKEN_ADDRESS = Address.fromString('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let TWO_BI = BigInt.fromI32(2);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);
export let MAX_BI = BigInt.fromString('115792089237316195423570985008687907853269984665640564039457584007913129639935');
