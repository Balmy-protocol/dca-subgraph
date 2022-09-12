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
  const token0 = tokenLibrary.getByAddress(token0Address);
  const token1 = tokenLibrary.getByAddress(token1Address);
  const token0ComesFirst = token1.id > token0.id;
  if (pair == null) {
    pair = new Pair(id);
    pair.tokenA = token0ComesFirst ? token0.id : token1.id;
    pair.tokenB = token0ComesFirst ? token1.id : token0.id;
    pair.activePositionIds = new Array<string>();
    pair.activePositionsPerInterval = [ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI];
    pair.lastSwappedAt = [ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI];
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
  const pair = Pair.load(id);
  return pair;
}

export function swapped(event: Swapped, transaction: Transaction): void {
  const id = event.address.toHexString();
  log.info('[Pair] Swapped {}', [id]);
  const pairs = event.params.swapInformation.pairs;
  const fee = event.params.fee;
  for (let i: i32 = 0; i < pairs.length; i++) {
    // O(n)
    const id = pairs[i].tokenA.toHexString().concat('-').concat(pairs[i].tokenB.toHexString());
    const pair = get(id)!;
    const intervals = intervalsFromBytes(pairs[i].intervalsInSwap);
    // Check if there was any interval in the swap
    const hasExecutedSwaps = intervals.length !== 0;
    if (!hasExecutedSwaps) {
      continue;
    }

    const pairSwap = pairSwapLibrary.create(pair, pairs[i], transaction, fee);
    const activePositionIds = pair.activePositionIds;
    const newActivePositionsPerInterval = pair.activePositionsPerInterval;
    const newActivePositionIds = pair.activePositionIds;
    const newLastSwappedAt = pair.lastSwappedAt;
    // Update all last swaped at by interval
    for (let x: i32 = 0; x < intervals.length; x++) {
      const indexOfInterval = getIndexOfInterval(intervals[x]);
      if (newActivePositionsPerInterval[indexOfInterval].gt(ZERO_BI)) {
        newLastSwappedAt[indexOfInterval] = transaction.timestamp;
      }
    }
    // Iterate all pairs active position
    for (let x: i32 = 0; x < activePositionIds.length; x++) {
      // O(m)
      // Check if we are executing the interval that the position has
      if (positionLibrary.shouldRegisterPairSwap(activePositionIds[x], intervals)) {
        // Applies swap to position.
        const positionAndState = positionLibrary.registerPairSwap(activePositionIds[x], pair, pairSwap, transaction); // O(1)
        // If remaining swap is zero, we need to do some further modifications
        if (positionAndState.positionState.remainingSwaps.equals(ZERO_BI)) {
          // Take position from active positions
          newActivePositionIds.splice(newActivePositionIds.indexOf(positionAndState.position.id), 1); // O(x + x), where worst x scenario x = m
          const indexOfInterval = getIndexOfInterval(BigInt.fromString(positionAndState.position.swapInterval));
          // Reduce active positions per interval
          newActivePositionsPerInterval[indexOfInterval] = newActivePositionsPerInterval[indexOfInterval].minus(ONE_BI);
        }
      }
    }
    // Update all pair's information
    pair.activePositionIds = newActivePositionIds;
    pair.activePositionsPerInterval = newActivePositionsPerInterval;
    pair.lastSwappedAt = newLastSwappedAt;
    pair.save();
  }
} // O (n*2m) ?

export function addActivePosition(position: Position): Pair {
  log.info('[Pair] Add active position {}', [position.pair]);
  const pair = get(position.pair)!;
  // Add to active positions
  const newActivePositionIds = pair.activePositionIds;
  // This can be greatly optimizied by saving index of active position on position.
  let found = false;
  for (let i: i32 = 0; i < newActivePositionIds.length && !found; i++) {
    if (newActivePositionIds[i] == position.id) {
      found = true;
    }
  }
  if (!found) {
    newActivePositionIds.push(position.id);
    pair.activePositionIds = newActivePositionIds;
    // Add to active positions per interval
    const indexOfPositionInterval = getIndexOfInterval(BigInt.fromString(position.swapInterval));
    const activePositionsPerInterval = pair.activePositionsPerInterval;
    activePositionsPerInterval[indexOfPositionInterval] = activePositionsPerInterval[indexOfPositionInterval].plus(ONE_BI);
    pair.activePositionsPerInterval = activePositionsPerInterval;

    pair.save();
  }

  return pair;
}

export function removeActivePosition(position: Position): Pair {
  log.info('[Pair] Remove active position {}', [position.pair]);
  const pair = get(position.pair)!;
  // Remove from active positions
  if (pair.activePositionIds.includes(position.id)) {
    const newActivePositionIds = pair.activePositionIds;
    newActivePositionIds.splice(newActivePositionIds.indexOf(position.id), 1);
    pair.activePositionIds = newActivePositionIds;

    // Remove from active positions per interval
    const indexOfPositionInterval = getIndexOfInterval(BigInt.fromString(position.swapInterval));
    const activePositionsPerInterval = pair.activePositionsPerInterval;
    activePositionsPerInterval[indexOfPositionInterval] = activePositionsPerInterval[indexOfPositionInterval].minus(ONE_BI);
    pair.activePositionsPerInterval = activePositionsPerInterval;

    pair.save();
  }
  return pair;
}
