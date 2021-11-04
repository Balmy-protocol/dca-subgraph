import { SwapInterval } from '../../generated/schema';

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

export const intervalsfromByte = (byte: string): i32[] => {
  let intervals = getIntervals();
  let num = parseInt(byte);
  let index = 0;
  let result = new Array<i32>();
  while (index <= 8 && 1 << index <= num) {
    let currentNumber = 1 << index;
    if ((num & currentNumber) != 0) {
      result.push(intervals[index]);
    }
    index++;
  }
  return result;
};
