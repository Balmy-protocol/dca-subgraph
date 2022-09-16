import { log, BigInt } from '@graphprotocol/graph-ts';
import { Transaction, Pair, PairSwap, PairSwapInterval } from '../../generated/schema';
import { SwappedSwapInformationPairsStruct } from '../../generated/Hub/Hub';
import { intervalsFromBytes } from './intervals';

export function create(pair: Pair, event: SwappedSwapInformationPairsStruct, transaction: Transaction, fee: BigInt): PairSwap {
  const pairSwapId = pair.id.concat('-').concat(transaction.id);
  log.info('[PairSwap] Create {}', [pairSwapId]);
  let pairSwap = PairSwap.load(pairSwapId);
  if (pairSwap == null) {
    pairSwap = new PairSwap(pairSwapId);
    pairSwap.pair = pair.id;
    pairSwap.swapper = transaction.from;
    pairSwap.ratioBToA = event.ratioBToA;
    pairSwap.ratioBToAWithFee = APPLY_FEE(fee, event.ratioBToA);
    pairSwap.ratioAToB = event.ratioAToB;
    pairSwap.ratioAToBWithFee = APPLY_FEE(fee, event.ratioAToB);
    pairSwap.transaction = transaction.id;
    pairSwap.executedAtBlock = transaction.blockNumber;
    pairSwap.executedAtTimestamp = transaction.timestamp;
    pairSwap.save();

    const intervals = intervalsFromBytes(event.intervalsInSwap);
    for (let i: i32 = 0; i < intervals.length; i++) {
      const pairSwapIntervalId = pairSwapId.concat('-').concat(intervals[i].toString());
      const pairSwapInterval = new PairSwapInterval(pairSwapIntervalId);
      pairSwapInterval.pair = pair.id;
      pairSwapInterval.pairSwap = pairSwapId;
      pairSwapInterval.swapInterval = intervals[i].toString();
      pairSwapInterval.save();
    }
  }
  return pairSwap;
}

function APPLY_FEE(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  const feeAmount = amount.times(fee).div(FEE_PRECISION).div(BigInt.fromI32(100));
  return amount.minus(feeAmount);
}
