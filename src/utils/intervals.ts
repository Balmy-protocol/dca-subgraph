import { SwapInterval } from '../../generated/schema';
import { BigInt, ByteArray, Bytes, log } from '@graphprotocol/graph-ts';
import { ONE_BI, TWO_BI, ZERO_BI } from './constants';

let ONE_MINUTE = 60;
let FIVE_MINUTES = ONE_MINUTE * 5;
let FIFTEEN_MINUTES = FIVE_MINUTES * 3;
let THIRTY_MINUTES = FIFTEEN_MINUTES * 2;
let ONE_HOUR = THIRTY_MINUTES * 2;
let FOUR_HOURS = ONE_HOUR * 4;
let ONE_DAY = FOUR_HOURS * 6;
let ONE_WEEK = ONE_DAY * 7;

const getIntervals = (): i32[] => {
  let INTERVALS = new Array<i32>();
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

export const intervalsFromBytes = (intervalsBytes: Bytes): i32[] => {
  let intervals = getIntervals();
  let result = new Array<i32>();
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
