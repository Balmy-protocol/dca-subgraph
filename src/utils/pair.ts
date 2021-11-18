import { log, ethereum, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import { Transaction, Pair } from '../../generated/schema';
import * as tokenLibrary from '../utils/token';
import * as positionLibrary from '../utils/position';
import * as pairSwapLibrary from '../utils/pair-swap';
import { Swapped } from '../../generated/Hub/Hub';
import { ONE_BI, ZERO_BI } from './constants';
import { intervalsFromBytes } from './intervals';

export function create(id: string, token0Address: Address, token1Address: Address, transaction: Transaction): Pair {
  log.info('[Pair] Create {}', [id]);
  let pair = Pair.load(id);
  let token0 = tokenLibrary.getOrCreate(token0Address);
  let token1 = tokenLibrary.getOrCreate(token1Address);
  let token0ComesFirst = token1.id > token0.id;
  if (pair == null) {
    pair = new Pair(id);
    pair.tokenA = token0ComesFirst ? token0.id : token1.id;
    pair.tokenB = token0ComesFirst ? token1.id : token0.id;
    pair.positionIds = new Array<string>();
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
    let id = pairs[i].tokenA.toHexString().concat('-').concat(pairs[i].tokenB.toHexString());
    let pair = get(id)!;
    let pairSwap = pairSwapLibrary.create(pair, pairs[i], transaction, fee);
    let intervals = intervalsFromBytes(pairs[i].intervalsInSwap);
    let positionIds = pair.positionIds;
    for (let x: i32 = 0; x < positionIds.length; x++) {
      positionLibrary.registerPairSwap(positionIds[x], pair, pairSwap, intervals, transaction);
    }
  }
}
