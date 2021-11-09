import { SwapInterval } from '../../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

let ONE_MINUTE = 60;
let FIVE_MINUTES = ONE_MINUTE * 5;
let FIFTEEN_MINUTES = FIVE_MINUTES * 3;
let THIRTY_MINUTES = FIFTEEN_MINUTES * 2;
let ONE_HOUR = THIRTY_MINUTES * 2;
let FOUR_HOURS = ONE_HOUR * 4;
let ONE_DAY = FOUR_HOURS * 6;
let ONE_WEEK = ONE_DAY * 7;

const getIntervals = (): i32[] => {
  let INTERVALS = new Array<i32>(8);
  INTERVALS.push(ONE_MINUTE);
  INTERVALS.push(FIVE_MINUTES);
  INTERVALS.push(FIFTEEN_MINUTES);
  INTERVALS.push(THIRTY_MINUTES);
  INTERVALS.push(ONE_HOUR);
  INTERVALS.push(FOUR_HOURS);
  INTERVALS.push(ONE_DAY);
  INTERVALS.push(ONE_WEEK);

  return INTERVALS;
};

const getBitIntervals = (): BigInt[] => {
  let BIT_INTERVALS = new Array<BigInt>(8);
  BIT_INTERVALS.push(BigInt.fromString('1'));
  BIT_INTERVALS.push(BigInt.fromString('2'));
  BIT_INTERVALS.push(BigInt.fromString('4'));
  BIT_INTERVALS.push(BigInt.fromString('8'));
  BIT_INTERVALS.push(BigInt.fromString('16'));
  BIT_INTERVALS.push(BigInt.fromString('32'));
  BIT_INTERVALS.push(BigInt.fromString('64'));
  BIT_INTERVALS.push(BigInt.fromString('128'));

  return BIT_INTERVALS;
};

export const intervalsfromByte = (byte: string): i32[] => {
  let intervals = getIntervals();
  let bit_intervals = getBitIntervals();
  let num = BigInt.fromString(byte);
  let result = new Array<i32>();
  for (let i: i32 = 0; i <= 8; i++) {
    if (num & bit_intervals[i]) {
      result.push(intervals[i]);
    }
  }
  return result;
};
