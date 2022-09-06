import { log, BigInt } from '@graphprotocol/graph-ts';
import { Transaction, Pair, PairSwap, PairSwapInterval } from '../../generated/schema';
import { SwappedSwapInformationPairsStruct } from '../../generated/Hub/Hub';
import { intervalsFromBytes } from './intervals';

export function create(pair: Pair, event: SwappedSwapInformationPairsStruct, transaction: Transaction, fee: BigInt): PairSwap {
  let pairSwapId = pair.id.concat('-').concat(transaction.id);
  log.info('[PairSwap] Create {}', [pairSwapId]);
  let pairSwap = PairSwap.load(pairSwapId);
  if (pairSwap == null) {
    pairSwap = new PairSwap(pairSwapId);
    pairSwap.pair = pair.id;
    pairSwap.swapper = transaction.from;
    pairSwap.ratioPerUnitBToA = event.ratioBToA;
    pairSwap.ratioPerUnitBToAWithFee = APPLY_FEE(fee, event.ratioBToA);
    pairSwap.ratioPerUnitAToB = event.ratioAToB;
    pairSwap.ratioPerUnitAToBWithFee = APPLY_FEE(fee, event.ratioAToB);
    pairSwap.transaction = transaction.id;
    pairSwap.executedAtBlock = transaction.blockNumber;
    pairSwap.executedAtTimestamp = transaction.timestamp;
    pairSwap.save();

    let intervals = intervalsFromBytes(event.intervalsInSwap);
    for (let i: i32 = 0; i < intervals.length; i++) {
      let pairSwapIntervalId = pairSwapId.concat('-').concat(intervals[i].toString());
      let pairSwapInterval = new PairSwapInterval(pairSwapIntervalId);
      pairSwapInterval.pair = pair.id;
      pairSwapInterval.pairSwap = pairSwapId;
      pairSwapInterval.swapInterval = intervals[i].toString();
      // FIX: swapPerformed
      pairSwapInterval.save();
    }
  }
  return pairSwap;
}

function APPLY_FEE(fee: BigInt, amount: BigInt): BigInt {
  let FEE_PRECISION = BigInt.fromI32(10000);
  let feeAmount = amount.times(fee).div(FEE_PRECISION).div(BigInt.fromI32(100));
  return amount.minus(feeAmount);
}
