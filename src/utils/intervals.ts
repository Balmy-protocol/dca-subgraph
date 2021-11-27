import { SwapInterval } from '../../generated/schema';
import { BigInt, ByteArray, Bytes, log } from '@graphprotocol/graph-ts';
import { ONE_BI, TWO_BI, ZERO_BI } from './constants';

let ONE_MINUTE = BigInt.fromI32(60);
let FIVE_MINUTES = ONE_MINUTE.times(BigInt.fromI32(5));
let FIFTEEN_MINUTES = FIVE_MINUTES.times(BigInt.fromI32(3));
let THIRTY_MINUTES = FIFTEEN_MINUTES.times(BigInt.fromI32(2));
let ONE_HOUR = THIRTY_MINUTES.times(BigInt.fromI32(2));
let FOUR_HOURS = ONE_HOUR.times(BigInt.fromI32(4));
let ONE_DAY = FOUR_HOURS.times(BigInt.fromI32(6));
let ONE_WEEK = ONE_DAY.times(BigInt.fromI32(7));

export const getIntervals = (): BigInt[] => {
  let INTERVALS = new Array<BigInt>();
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

export const getIndexOfInterval = (swapInterval: BigInt): i32 => {
  if (swapInterval.equals(ONE_MINUTE)) return 0;
  if (swapInterval.equals(FIVE_MINUTES)) return 1;
  if (swapInterval.equals(FIFTEEN_MINUTES)) return 2;
  if (swapInterval.equals(THIRTY_MINUTES)) return 3;
  if (swapInterval.equals(ONE_HOUR)) return 4;
  if (swapInterval.equals(FOUR_HOURS)) return 5;
  if (swapInterval.equals(ONE_DAY)) return 6;
  return 7;
};

export const intervalsFromBytes = (intervalsBytes: Bytes): BigInt[] => {
  let intervals = getIntervals();
  let result = new Array<BigInt>();
  let intervalsAsNumber = BigInt.fromI32(intervalsBytes.toI32());
  let cycle = 0;
  while (intervalsAsNumber.gt(ZERO_BI)) {
    if (intervalsAsNumber.notEqual(ONE_BI) && intervalsAsNumber.mod(TWO_BI).notEqual(ZERO_BI)) {
      result.push(intervals[cycle]);
    } else if (intervalsAsNumber.equals(ONE_BI)) {
      result.push(intervals[cycle]);
      intervalsAsNumber = ZERO_BI;
    }
    cycle = cycle + 1;
    intervalsAsNumber = intervalsAsNumber.div(TWO_BI);
  }
  return result;
};
