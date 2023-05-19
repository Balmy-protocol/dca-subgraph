import { log, BigInt, Address } from '@graphprotocol/graph-ts';
import { Transaction, Pair, PairSwap, PairSwapInterval } from '../../generated/schema';
import { SwappedSwapInformationPairsStruct } from '../../generated/TransformerRegistry/Hub';
import { intervalsFromBytes } from './intervals';
import * as tokenLibrary from './token';

export function create(pair: Pair, event: SwappedSwapInformationPairsStruct, transaction: Transaction, fee: BigInt): PairSwap {
  const pairSwapId = pair.id.concat('-').concat(transaction.id);
  log.info('[PairSwap] Create {}', [pairSwapId]);
  let pairSwap = PairSwap.load(pairSwapId);
  const tokenA = tokenLibrary.getById(pair.tokenA);
  const tokenB = tokenLibrary.getById(pair.tokenB);
  if (pairSwap == null) {
    pairSwap = new PairSwap(pairSwapId);
    pairSwap.pair = pair.id;
    pairSwap.swapper = transaction.from;

    // Set ratios b to a
    pairSwap.ratioBToA = event.ratioBToA;
    pairSwap.ratioBToAWithFee = APPLY_FEE(fee, event.ratioBToA);

    // Set ratios a to b
    pairSwap.ratioAToB = event.ratioAToB;
    pairSwap.ratioAToBWithFee = APPLY_FEE(fee, event.ratioAToB);

    // Check yield-bearing-share on tokenA
    let underlyingPerTokenA = tokenA.magnitude;
    let underlyingPerTokenB = tokenB.magnitude;
    if (tokenA.type == 'YIELD_BEARING_SHARE') {
      underlyingPerTokenA = tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(pair.tokenA), tokenA.magnitude);
    }

    // Check yield-bearing-share on tokenB
    if (tokenB.type == 'YIELD_BEARING_SHARE') {
      underlyingPerTokenB = tokenLibrary.transformYieldBearingSharesToUnderlying(Address.fromString(pair.tokenB), tokenB.magnitude);
    }

    /**
     * tokenA = waWBTC
     * tokenB = waUSDC
     *
     * magnitudeTokenA waWBTC = underlyingPerTokenA WBTC
     * => magnitudeTokenA/underlyingPerTokenA waWBTC = 1 WBTC
     * => magnitudeTokenA*magnitudeTokenA/underlyingPerTokenA waWBTC = magnitudeTokenA WBTC
     * magnitudeTokenA waWBTC = ratioAToB waUSDC
     * magnitudeTokenB waUSDC = underlyingPerTokenB USDC
     *   => 1 waUSDC = underlyingPerTokenB/magnitudeTokenB USDC
     *   => ratioAToB waUSDC = ratioAToB*underlyingPerTokenB/magnitudeTokenB USDC
     *
     *
     * magnitudeTokenA WBTC = magnitudeTokenA*magnitudeTokenA/underlyingPerTokenA waWBTC
     *         = magnitudeTokenA/underlyingPerTokenA * ratioAToB waUSDC
     *         = magnitudeTokenA/underlyingPerTokenA * ratioAToB*underlyingPerTokenB/magnitudeTokenB USDC
     *         = magnitudeTokenA * ratioAToB * underlyingPerTokenB / (underlyingPerTokenA * magnitudeTokenB) USDC
     *           = magnitudeTokenA * ratioAToB * underlyingPerTokenB / (underlyingPerTokenA * magnitudeTokenB) USDC
     *
     * underlyingRatioAToB = magnitudeTokenA * ratioAToB * underlyingPerTokenB / (underlyingPerTokenA * magnitudeTokenB)
     */

    pairSwap.ratioUnderlyingBToA = tokenB.magnitude
      .times(pairSwap.ratioBToA)
      .times(underlyingPerTokenA)
      .div(underlyingPerTokenB.times(tokenA.magnitude));
    pairSwap.ratioUnderlyingBToAWithFee = tokenB.magnitude
      .times(pairSwap.ratioBToAWithFee)
      .times(underlyingPerTokenA)
      .div(underlyingPerTokenB.times(tokenA.magnitude));

    pairSwap.ratioUnderlyingAToB = tokenA.magnitude
      .times(pairSwap.ratioAToB)
      .times(underlyingPerTokenB)
      .div(underlyingPerTokenA.times(tokenB.magnitude));
    pairSwap.ratioUnderlyingAToBWithFee = tokenA.magnitude
      .times(pairSwap.ratioAToBWithFee)
      .times(underlyingPerTokenB)
      .div(underlyingPerTokenA.times(tokenB.magnitude));

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
