import { log, ethereum, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import { Transaction, Pair } from '../../generated/schema';
import * as tokenLibrary from '../utils/token';
import * as positionLibrary from '../utils/position';
import * as pairSwapLibrary from '../utils/pair-swap';
import { Swapped } from '../../generated/Hub/Hub';

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
  return pair!;
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
  // let pairs = event.params.swapInformation.pairs;
  // pairs.forEach((incomingPair) => {
  //   let fee = event.params.fee;
  //   let pair = get(`${incomingPair.tokenA}-${incomingPair.tokenB}`);
  //   let pairSwap = pairSwapLibrary.create(pair!, incomingPair, transaction, fee);
  //   let positionIdsLength = pair.positionIds.length;
  //   let positionIds = pair.positionIds;
  //   for (let i: i32 = 0; i <= positionIdsLength; i++) {
  //     positionLibrary.registerPairSwap(positionIds[i], pair!, pairSwap, incomingPair.intervalsInSwap);
  //   }
  // });
}
