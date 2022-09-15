import { BigInt, log } from '@graphprotocol/graph-ts';
import { SwapInterval, Transaction } from '../../generated/schema';
import { SwapIntervalsAllowed, SwapIntervalsForbidden } from '../../generated/Hub/Hub';

export function getOrCreate(interval: BigInt, isActive: boolean): SwapInterval {
  let swapInterval = SwapInterval.load(interval.toString());

  if (swapInterval == null) {
    swapInterval = new SwapInterval(interval.toString());
    swapInterval.interval = interval;
    swapInterval.active = isActive;

    swapInterval.save();
  }

  return swapInterval;
}

export function addSwapIntervals(event: SwapIntervalsAllowed, transaction: Transaction): void {
  log.info('[SwapIntervals] Add swap interval', []);
  const intervals = event.params.swapIntervals;
  for (let i: i32 = 0; i < intervals.length; i++) {
    const swapInterval = getOrCreate(intervals[i], true);
    swapInterval.active = true;
    swapInterval.save();
  }
}

export function disableSwapIntervals(event: SwapIntervalsForbidden, transaction: Transaction): void {
  log.info('[SwapIntervals] Remove swap interval', []);
  const intervals = event.params.swapIntervals;
  for (let i: i32 = 0; i < intervals.length; i++) {
    const swapInterval = getOrCreate(intervals[i], false);
    swapInterval.active = false;
    swapInterval.save();
  }
}
