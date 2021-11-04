import { log, ethereum, BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import { Transaction, Pair } from '../../generated/schema';
import * as tokenLibrary from '../utils/token';
import * as positionLibrary from '../utils/position';
import * as pairSwapLibrary from '../utils/pair-swap';
import { Swapped } from '../../generated/Hub/Hub';

export function create(id: string, tokenAAddress: Address, tokenBAddress: Address, transaction: Transaction): Pair {
  log.info('[Pair] Create {}', [id]);
  let pair = Pair.load(id);
  let tokenA = tokenLibrary.getOrCreate(tokenAAddress);
  let tokenB = tokenLibrary.getOrCreate(tokenBAddress);
  if (pair == null) {
    pair = new Pair(id);
    pair.tokenA = tokenA.id;
    pair.tokenB = tokenB.id;
    pair.positionIds = new Array<string>();
    pair.transaction = transaction.id;
    pair.createdAtBlock = transaction.blockNumber;
    pair.createdAtTimestamp = transaction.timestamp;
    pair.save();
  }
  return pair!;
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
  pairs.forEach((incomingPair) => {
    let fee = event.params.fee;
    let pair = Pair.load(`${incomingPair.tokenA}-${incomingPair.tokenB}`);
    let pairSwap = pairSwapLibrary.create(pair as Pair, incomingPair, transaction, fee);
    let positionIdsLength = pair.positionIds.length;
    let positionIds = pair.positionIds;
    for (let i: i32 = 0; i <= positionIdsLength; i++) {
      positionLibrary.registerPairSwap(positionIds[i], pair as Pair, pairSwap, incomingPair.intervalsInSwap);
    }
  });
}
