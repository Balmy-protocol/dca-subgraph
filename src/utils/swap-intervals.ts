import { log } from '@graphprotocol/graph-ts';
import { SwapInterval, Transaction } from '../../generated/schema';
import { SwapIntervalsAllowed } from '../../generated/Hub/Hub';

export function addSwapIntervals(event: SwapIntervalsAllowed, transaction: Transaction): void {
  log.info('[GlobalParameters] Add swap interval', []);
  let intervals = event.params._swapIntervals;
  for (let i: i32 = 0; i < intervals.length; i++) {
    let swapIntervalId = intervals[i].toString();
    let swapInterval = SwapInterval.load(swapIntervalId);
    if (swapInterval == null) {
      swapInterval = new SwapInterval(swapIntervalId);
      swapInterval.interval = intervals[i];
    }
    swapInterval.save();
  }
}
