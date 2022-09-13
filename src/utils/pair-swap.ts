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
    pairSwap.ratioBToAWithFeeApplied = APPLY_FEE(fee, event.ratioBToA);
    pairSwap.ratioAToB = event.ratioAToB;
    pairSwap.ratioAToBWithFeeApplied = APPLY_FEE(fee, event.ratioAToB);
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

// _amount * (FeeMath.FEE_PRECISION - _fee / 100);
function APPLY_FEE(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  const feeAmount = amount.times(FEE_PRECISION.minus(fee.div(BigInt.fromI32(100))));
  return amount.minus(feeAmount);
}
