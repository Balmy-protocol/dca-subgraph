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
    pair.lastSwappedAt = ZERO_BI;
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
    let newActivePositionsPerInterval = pair.activePositionsPerInterval;
    let newActivePositionIds = pair.activePositionIds;
    for (let x: i32 = 0; x < activePositionIds.length; x++) {
      // O(m)
      let positionAndState = positionLibrary.registerPairSwap(activePositionIds[x], pair, pairSwap, transaction); // O(1)
      if (positionAndState.positionState.remainingSwaps.equals(ZERO_BI)) {
        newActivePositionIds.splice(newActivePositionIds.indexOf(positionAndState.position.id), 1); // O(x + x), where worst x scenario x = m
        let indexOfInterval = getIndexOfInterval(BigInt.fromString(positionAndState.position.swapInterval));
        newActivePositionsPerInterval[indexOfInterval] = newActivePositionsPerInterval[indexOfInterval].minus(ONE_BI);
      }
    }
    pair.activePositionIds = newActivePositionIds;
    pair.activePositionsPerInterval = newActivePositionsPerInterval;
    pair.lastSwappedAt = transaction.timestamp;
    pair.nextSwapAvailableAt = getNextSwapAvailableAt(newActivePositionsPerInterval, pair.lastSwappedAt);
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
  pair.nextSwapAvailableAt = getNextSwapAvailableAt(activePositionsPerInterval, pair.lastSwappedAt);
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
  pair.nextSwapAvailableAt = getNextSwapAvailableAt(activePositionsPerInterval, pair.lastSwappedAt);
  pair.save();
  return pair;
}

export function getNextSwapAvailableAt(activePositionsPerInterval: BigInt[], lastSwappedAt: BigInt): BigInt {
  let intervals = getIntervals();
  let indexOfCloserInterval = activePositionsPerInterval.length + 1;
  let i: i32 = 0;
  while (i < activePositionsPerInterval.length && indexOfCloserInterval == activePositionsPerInterval.length + 1) {
    if (activePositionsPerInterval[i].gt(ZERO_BI)) indexOfCloserInterval = i;
    i++;
  }
  if (indexOfCloserInterval == activePositionsPerInterval.length + 1) return MAX_BI;
  return lastSwappedAt.div(intervals[indexOfCloserInterval]).plus(ONE_BI).times(intervals[indexOfCloserInterval]);
}
