import { log, BigInt } from '@graphprotocol/graph-ts';
import { Transaction, Pair, PairSwap, PairSwapInterval } from '../../generated/schema';
import { SwappedSwapInformationPairsStruct } from '../../generated/Hub/Hub';
import { intervalsfromByte } from './intervals';

export function create(pair: Pair, event: SwappedSwapInformationPairsStruct, transaction: Transaction, fee: BigInt): PairSwap {
  let pairSwapId = pair.id.concat('-').concat(transaction.id);
  log.info('[PairSwap] Create {}', [pairSwapId]);
  let pairSwap = PairSwap.load(pairSwapId);
  if (pairSwap == null) {
    pairSwap = new PairSwap(pairSwapId);
    pairSwap.pair = pair.id;
    pairSwap.swapper = transaction.from;
    pairSwap.ratePerUnitBToA = event.ratioBToA;
    pairSwap.ratePerUnitBToAWithFee = APPLY_FEE(fee, event.ratioBToA);
    pairSwap.ratePerUnitAToB = event.ratioAToB;
    pairSwap.ratePerUnitAToBWithFee = APPLY_FEE(fee, event.ratioAToB);
    pairSwap.transaction = transaction.id;
    pairSwap.executedAtBlock = transaction.blockNumber;
    pairSwap.executedAtTimestamp = transaction.timestamp;
    pairSwap.save();

    let intervals = intervalsfromByte(event.intervalsInSwap.toString());
    intervals.forEach((interval) => {
      let pairSwapId = pair.id.concat('-').concat(transaction.id);
      let pairSwapIntervalId = pairSwapId.concat('-').concat(interval.toString());
      let pairSwapInterval = new PairSwapInterval(pairSwapIntervalId);
      pairSwapInterval.pair = pair.id;
      pairSwapInterval.pairSwap = pairSwapId;
      pairSwapInterval.swapInterval = interval.toString();
      pairSwapInterval.save();
    });
  }
  return pairSwap!;
}

function APPLY_FEE(fee: BigInt, amount: BigInt): BigInt {
  let FEE_PRECISION = BigInt.fromI32(10000);
  let feeAmount = amount.times(fee).div(FEE_PRECISION).div(BigInt.fromI32(100));
  return amount.minus(feeAmount);
}
