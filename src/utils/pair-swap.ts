import { log, BigInt, Address, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, Pair, PairSwap, PairSwapInterval, Token } from '../../generated/schema';
import { Swapped, SwappedSwapInformationPairsStruct, SwappedSwapInformationTokensStruct } from '../../generated/Hub/Hub';
import { intervalsFromBytes } from './intervals';
import { ONE_BI, ZERO_BI } from './constants';
import * as tokenLibrary from './token';
import { ExtendedPairInformation } from './types';

export function create(pair: Pair, swappedPairInformation: SwappedSwapInformationPairsStruct, transaction: Transaction, fee: BigInt): PairSwap {
  const pairSwapId = pair.id.concat('-').concat(transaction.id);
  log.info('[PairSwap] Create {}', [pairSwapId]);
  let pairSwap = PairSwap.load(pairSwapId);
  if (pairSwap == null) {
    pairSwap = new PairSwap(pairSwapId);
    pairSwap.pair = pair.id;
    pairSwap.swapper = transaction.from;
    pairSwap.totalAmountToSwapTokenA = swappedPairInformation.totalAmountToSwapTokenA;
    pairSwap.totalAmountToSwapTokenB = swappedPairInformation.totalAmountToSwapTokenB;
    pairSwap.ratioBToA = swappedPairInformation.ratioBToA;
    pairSwap.ratioBToAWithFeeApplied = applyFeeWithExtraPrecision(fee, swappedPairInformation.ratioBToA);
    pairSwap.ratioAToB = swappedPairInformation.ratioAToB;
    pairSwap.ratioAToBWithFeeApplied = applyFeeWithExtraPrecision(fee, swappedPairInformation.ratioAToB);
    pairSwap.transaction = transaction.id;
    pairSwap.executedAtBlock = transaction.blockNumber;
    pairSwap.executedAtTimestamp = transaction.timestamp;
    pairSwap.save();

    const intervals = intervalsFromBytes(swappedPairInformation.intervalsInSwap);
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

export function mapTokensInSwap(event: Swapped): Map<Address, SwappedSwapInformationTokensStruct> {
  log.debug('[PairSwap] Map tokens in swap', []);
  const tokensInSwapMapped = new Map<Address, SwappedSwapInformationTokensStruct>();
  const tokens = event.params.swapInformation.tokens;
  for (let i: i32 = 0; i < tokens.length; i++) {
    tokensInSwapMapped.set(tokens[i].token, tokens[i]);
  }
  return tokensInSwapMapped;
}

export function getExtendedPairInformation(event: Swapped): ExtendedPairInformation[] {
  log.debug('[PairSwap] Get extended pair information', []);
  const tokensInSwap = mapTokensInSwap(event);
  const neededPerToken = new Map<Address, BigInt>();
  const extendedPairInformation: ExtendedPairInformation[] = [];
  const pairs = event.params.swapInformation.pairs;
  // We calculate the total needed per token in each pair, and in aggregate
  for (let i: i32 = 0; i < pairs.length; i++) {
    const tokenA = pairs[i].tokenA;
    const tokenB = pairs[i].tokenB;
    const currentNeededA = neededPerToken.has(tokenA) ? neededPerToken.get(tokenA) : ZERO_BI;
    const currentNeededB = neededPerToken.has(tokenB) ? neededPerToken.get(tokenB) : ZERO_BI;
    const neededA = convertAndApplyFee(
      tokenLibrary.getByAddress(pairs[i].tokenB),
      pairs[i].totalAmountToSwapTokenB,
      pairs[i].ratioBToA,
      event.params.fee
    );
    const neededB = convertAndApplyFee(
      tokenLibrary.getByAddress(pairs[i].tokenA),
      pairs[i].totalAmountToSwapTokenA,
      pairs[i].ratioAToB,
      event.params.fee
    );

    extendedPairInformation.push(new ExtendedPairInformation(neededA, neededB, ZERO_BI, ZERO_BI));
    log.warning('needed per token A {}', [currentNeededA.plus(neededA).toHexString()]);
    neededPerToken.set(tokenA, currentNeededA.plus(neededA));
    log.warning('get needed per token A {}', [neededPerToken.get(tokenA)!.toHexString()]);
    neededPerToken.set(tokenB, currentNeededB.plus(neededB));
  }
  log.debug('pre platform fee', []);
  for (let i: i32 = 0; i < pairs.length; i++) {
    const tokenA = pairs[i].tokenA;
    const tokenB = pairs[i].tokenB;
    log.debug('pb {} {} pa {}', [
      tokenB.toHexString(),
      tokensInSwap.has(tokenB) ? 'true' : 'false',
      tokensInSwap.has(tokenA) ? 'true' : 'false',
    ]);

    // totalNeeded(tokenB)    - platformFee(tokenB)
    // needed(tokenB, pairAB) - platformFeeAtoB = needed(tokenB, pairAB) * platformFee(tokenB) / totalNeeded(tokenB)
    extendedPairInformation[i].platformFeeAToB = extendedPairInformation[i].neededTokenB
      .times(tokensInSwap.get(tokenB).platformFee)
      .div(neededPerToken.get(tokenB));
    // totalNeeded(tokenA)    - platformFee(tokenA)
    // needed(tokenA, pairAB) - platformFeeBtoA = needed(tokenA, pairAB) * platformFee(tokenA) / totalNeeded(tokenA)
    extendedPairInformation[i].platformFeeBToA = extendedPairInformation[i].neededTokenA
      .times(tokensInSwap.get(tokenA).platformFee)
      .div(neededPerToken.get(tokenA));
  }
  log.debug('post platform fee', []);
  return extendedPairInformation;
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/main/contracts/DCAHub/DCAHubSwapHandler.sol#L55
export function convertAndApplyFee(from: Token, amount: BigInt, ratioFromTo: BigInt, fee: BigInt): BigInt {
  // uint256 _numerator = FeeMath.subtractFeeFromAmount(_swapFee, _amountFrom * _rateFromTo);
  // _amountTo = _numerator / _fromTokenMagnitude;
  // // Note: we need to round up because we can't ask for less than what we actually need
  // if (_numerator % _fromTokenMagnitude != 0) _amountTo++;
  const numerator = applyFee(fee, amount.times(ratioFromTo));
  let amountTo = numerator.div(from.magnitude);
  if (numerator.mod(from.magnitude).notEqual(ZERO_BI)) amountTo = amountTo.plus(ONE_BI);
  return amountTo;
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/0fc7a600604c694e22b35bed53d7c7a12b8bca10/contracts/libraries/FeeMath.sol#L30
export function applyFee(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  // (_amount * (FEE_PRECISION - _fee / 100)) / FEE_PRECISION;
  return amount.times(FEE_PRECISION.minus(fee.div(BigInt.fromI32(100)))).div(FEE_PRECISION);
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/main/contracts/DCAHub/DCAHubSwapHandler.sol#L331
export function applyFeeWithExtraPrecision(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  const feeAmount = amount.times(FEE_PRECISION.minus(fee.div(BigInt.fromI32(100))));
  return amount.minus(feeAmount);
}
