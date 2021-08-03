import { log, ethereum, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Transaction, Pair } from '../../generated/schema';
import { PairCreated } from '../../generated/Factory/Factory';
import { Pair as PairTemplate } from '../../generated/templates';
import * as tokenLibrary from '../utils/token';
import * as positionLibrary from '../utils/position';
import * as pairSwapLibrary from '../utils/pair-swap';
import { Swapped } from '../../generated/Factory/Pair';
import { Pair as PairContract } from '../../generated/Factory/Pair';
import { ZERO_BI } from './constants';

export function create(event: PairCreated, transaction: Transaction): Pair {
  let id = event.params._pair.toHexString();
  log.info('[Pair] Create {}', [id]);
  let pair = Pair.load(id);
  let tokenA = tokenLibrary.getOrCreate(event.params._tokenA);
  let tokenB = tokenLibrary.getOrCreate(event.params._tokenB);
  if (pair == null) {
    pair = new Pair(id);
    pair.tokenA = tokenA.id;
    pair.tokenB = tokenB.id;
    pair.highestId = ZERO_BI; // TODO: Remove this patch
    pair.transaction = transaction.id;
    pair.createdAtBlock = transaction.blockNumber;
    pair.createdAtTimestamp = transaction.timestamp;
    pair.save();
    PairTemplate.create(event.params._pair);
  }
  return pair!;
}

export function get(id: string): Pair {
  log.info('[Pair] Get {}', [id]);
  let pair = Pair.load(id);
  if (pair == null) throw Error('Pair not found');
  return pair!;
}

export function swapped(event: Swapped, transaction: Transaction): void {
  let id = event.address.toHexString();
  log.info('[Pair] Swapped {}', [id]);
  let pair = get(id);
  let pairSwap = pairSwapLibrary.create(pair, event, transaction);
  // let pairContract = PairContract.bind(event.address); // TODO: use other "to" -- learn about type conversion
  let swapsToPerform = event.params._nextSwapInformation.swapsToPerform;
  let amountOfSwaps = event.params._nextSwapInformation.amountOfSwaps;
  for (let i: i32 = 1; i <= pair.highestId.toI32(); i++) {
    positionLibrary.registerPairSwap(i.toString(), pair, pairSwap, swapsToPerform, amountOfSwaps);
  }
}
