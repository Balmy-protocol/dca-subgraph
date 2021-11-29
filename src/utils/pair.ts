import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import { Transaction, Pair, Position } from '../../generated/schema';
import * as tokenLibrary from '../utils/token';
import * as positionLibrary from '../utils/position';
import * as pairSwapLibrary from '../utils/pair-swap';
import { Swapped } from '../../generated/Hub/Hub';
import { MAX_BI, ONE_BI, ZERO_BI } from './constants';
import { getIndexOfInterval, getIntervals, intervalsFromBytes } from './intervals';

export function create(id: string, token0Address: Address, token1Address: Address, swapInterval: BigInt, transaction: Transaction): Pair {
  log.info('[Pair] Create {}', [id]);
  let pair = Pair.load(id);
  let token0 = tokenLibrary.getOrCreate(token0Address);
  let token1 = tokenLibrary.getOrCreate(token1Address);
  let token0ComesFirst = token1.id > token0.id;
  if (pair == null) {
    pair = new Pair(id);
    pair.tokenA = token0ComesFirst ? token0.id : token1.id;
    pair.tokenB = token0ComesFirst ? token1.id : token0.id;
    pair.activePositionIds = new Array<string>();
    pair.activePositionsPerInterval = [ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI];
    pair.nextSwapAvailableAt = MAX_BI;
    pair.transaction = transaction.id;
    pair.createdAtBlock = transaction.blockNumber;
    pair.createdAtTimestamp = transaction.timestamp;
    pair.save();
  }
  return pair;
}

export function buildId(token0Address: string, token1Address: string): string {
  log.debug('[Pair] Build id {} {}', [token0Address, token1Address]);
  return token1Address > token0Address ? token0Address.concat('-').concat(token1Address) : token1Address.concat('-').concat(token0Address);
}

export function get(id: string): Pair | null {
  log.info('[Pair] Get {}', [id]);
  let pair = Pair.load(id);
  return pair;
}

export function swapped(event: Swapped, transaction: Transaction): void {
  let id = event.address.toHexString();
  log.info('[Pair] Swapped {}', [id]);
  let pairs = event.params.swapInformation.pairs;
  let fee = event.params.fee;
  for (let i: i32 = 0; i < pairs.length; i++) {
    // O(n)
    let id = pairs[i].tokenA.toHexString().concat('-').concat(pairs[i].tokenB.toHexString());
    let pair = get(id)!;
    let pairSwap = pairSwapLibrary.create(pair, pairs[i], transaction, fee);
    let activePositionIds = pair.activePositionIds;
    let newactivePositionsPerInterval = pair.activePositionsPerInterval;
    let newActivePositionIds = pair.activePositionIds;
    let closerActiveTimeInterval = MAX_BI;
    for (let x: i32 = 0; x < activePositionIds.length; x++) {
      // O(m)
      let positionAndState = positionLibrary.registerPairSwap(activePositionIds[x], pair, pairSwap, transaction); // O(1)
      if (positionAndState.positionState.remainingSwaps.equals(ZERO_BI)) {
        newActivePositionIds.splice(newActivePositionIds.indexOf(positionAndState.position.id), 1); // O(x + x), where worst x scenario x = m
        let indexOfInterval = getIndexOfInterval(BigInt.fromString(positionAndState.position.swapInterval));
        newactivePositionsPerInterval[indexOfInterval] = newactivePositionsPerInterval[indexOfInterval].minus(ONE_BI);
      } else {
        let positionTimeInterval = BigInt.fromString(positionAndState.position.swapInterval);
        if (positionTimeInterval.lt(closerActiveTimeInterval)) closerActiveTimeInterval = positionTimeInterval;
      }
    }
    pair.activePositionIds = newActivePositionIds;
    pair.activePositionsPerInterval = newactivePositionsPerInterval;
    pair.nextSwapAvailableAt = transaction.timestamp.plus(closerActiveTimeInterval);
    pair.save();
  }
} // O (n*2m) ?

export function addActivePosition(position: Position): Pair {
  log.info('[Pair] Add active position {}', [position.pair]);
  let pair = get(position.pair)!;
  // Add to active positions
  let newActivePositionIds = pair.activePositionIds;
  newActivePositionIds.push(position.id);
  pair.activePositionIds = newActivePositionIds;
  // Add to active positions per interval
  let indexOfPositionInterval = getIndexOfInterval(BigInt.fromString(position.swapInterval));
  let activePositionsPerInterval = pair.activePositionsPerInterval;
  activePositionsPerInterval[indexOfPositionInterval] = activePositionsPerInterval[indexOfPositionInterval].plus(ONE_BI);
  pair.activePositionsPerInterval = activePositionsPerInterval;
  // Get new next swap available at
  if (pair.nextSwapAvailableAt.equals(MAX_BI)) {
    // If next swap available at == MAX_BI => This is the first position on pair from being stale or newly created
    pair.nextSwapAvailableAt = ZERO_BI;
  } else {
    // If not, then get next swap available at
    pair.nextSwapAvailableAt = getNextSwapAvailableAtAfterPositionChange(position, activePositionsPerInterval, pair.nextSwapAvailableAt);
  }
  pair.save();
  return pair;
}

export function removeActivePosition(position: Position): Pair {
  log.info('[Pair] Remove active position {}', [position.pair]);
  let pair = get(position.pair)!;
  // Add to active positions
  let newActivePositionIds = pair.activePositionIds;
  newActivePositionIds.splice(newActivePositionIds.indexOf(position.id), 1); // This can be greatly optimizied by saving index of active position on position.
  pair.activePositionIds = newActivePositionIds;
  // Remove to active positions per interval
  let indexOfPositionInterval = getIndexOfInterval(BigInt.fromString(position.swapInterval));
  let activePositionsPerInterval = pair.activePositionsPerInterval;
  activePositionsPerInterval[indexOfPositionInterval] = activePositionsPerInterval[indexOfPositionInterval].minus(ONE_BI);
  pair.activePositionsPerInterval = activePositionsPerInterval;
  // Get new next swap available at
  pair.nextSwapAvailableAt = getNextSwapAvailableAtAfterPositionChange(position, activePositionsPerInterval, pair.nextSwapAvailableAt);
  pair.save();
  return pair;
}

// Used when:
// - A new position in an old pair is created
// - A position has its "remaining swaps" set to 0 (informally terminated)
// - A position is terminated
// Not used when:
// - Swaps are registered
export function getNextSwapAvailableAtAfterPositionChange(
  position: Position,
  activePositionsPerInterval: BigInt[],
  nextSwapAvailableAt: BigInt
): BigInt {
  let intervals = getIntervals();
  let indexOfPositionInterval = getIndexOfInterval(BigInt.fromString(position.swapInterval));
  let indexOfCloserInterval = activePositionsPerInterval.length + 1;
  let i: i32 = 0;
  while (i < activePositionsPerInterval.length && indexOfCloserInterval == activePositionsPerInterval.length + 1) {
    if (activePositionsPerInterval[i].gt(ZERO_BI)) indexOfCloserInterval = i;
    i++;
  }
  if (indexOfCloserInterval == activePositionsPerInterval.length + 1) {
    // That was the last active position on the pair, so let's set nextSwapAvailableAt to infinity.
    return MAX_BI;
  } else if (indexOfCloserInterval > indexOfPositionInterval) {
    // The position that was (most probably) removed was the last one on the interval signaling when the next swap available was.
    return nextSwapAvailableAt.minus(intervals[indexOfPositionInterval]).plus(intervals[indexOfCloserInterval]);
  } else if (indexOfCloserInterval < indexOfPositionInterval) {
    // The position that was (most probably) added is on a shorter interval than the one that was signaling  the next swap available at
    return ZERO_BI;
  }
  // Removed position is on the same interval as the one signaling next swap available at
  return nextSwapAvailableAt;
}

// index of position interval = 7
// index of closer interval = 8
// we might need to indicate if its a new position or not.
// => ZERO_BI

// If position is new, and activePositionsPerInterval doesnt have position accounted for
// indexOfCloserInterval == activePositionsPerInterval.length + 1 => ZERO_BI
// indexOfCloserInterval > indexOfPositionInterval => ZERO_BI
// indexOfCloserInterval < indexOfPositionInterval => nextSwapAvailableAt should not be modified
// indexOfCloserInterval == indexOfPositionInterval => nextSwapAvailableAt should not be modified

// If position is being removed and activePositionsPerInterval doesnt have position accounted for
// indexOfCloserInterval == activePositionsPerInterval.length + 1 => MAX_BI
// indexOfCloserInterval > indexOfPositionInterval => nextSwapAvailableAt.minus(intervals[indexOfPositionInterval]).plus(intervals[indexOfCloserInterval]);
// indexOfCloserInterval < indexOfPositionInterval => nextSwapAvailableAt should not be modified
// indexOfCloserInterval == indexOfPositionInterval => nextSwapAvailableAt should not be modified
