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

export function getPlatformFeeMap(event: Swapped): PlatformFeeMap {
  log.debug('[PairSwap] Map tokens in swap', []);
  const tokensInSwapMapped = new PlatformFeeMap();
  const tokens = event.params.swapInformation.tokens;
  for (let i: i32 = 0; i < tokens.length; i++) {
    tokensInSwapMapped.addPlatformFee(tokens[i].token, tokens[i].platformFee);
  }
  return tokensInSwapMapped;
}

export function getExtendedPairInformation(event: Swapped): ExtendedPairInformation[] {
  log.debug('[PairSwap] Get extended pair information', []);
  const platformFeeByTokens = getPlatformFeeMap(event);
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
    neededPerToken.set(tokenA, currentNeededA.plus(neededA));
    neededPerToken.set(tokenB, currentNeededB.plus(neededB));
  }
  log.warning('pre platform fee', []);
  for (let i: i32 = 0; i < pairs.length; i++) {
    const tokenA = pairs[i].tokenA;
    const tokenB = pairs[i].tokenB;
    // log.error('hash {} ta {} tb {} ta by index {} tb by index {}', [
    //   event.transaction.hash.toHexString(),
    //   platformFeeByTokens.has(tokenA) ? 'true' : 'false',
    //   platformFeeByTokens.has(tokenB) ? 'true' : 'false',
    //   tokensAddresses.indexOf(tokenA).toString(),
    //   tokensAddresses.indexOf(tokenB).toString()
    // ]);
    // if (!platformFeeByTokens.has(tokenA)) log.error('ta {}', [tokenA.toHexString()]);
    // if (!platformFeeByTokens.has(tokenB)) log.error('tb {}', [tokenB.toHexString()]);
    // log.error(' - ', []);
    // log.error(' - ', []);
    // log.error(' - ', []);

    // totalNeeded(tokenB)    - platformFee(tokenB)
    // needed(tokenB, pairAB) - platformFeeAtoB = needed(tokenB, pairAB) * platformFee(tokenB) / totalNeeded(tokenB)
    extendedPairInformation[i].platformFeeAToB = extendedPairInformation[i].neededTokenB
      .times(platformFeeByTokens.getPlatformFee(tokenB))
      .div(neededPerToken.get(tokenB));
    // totalNeeded(tokenA)    - platformFee(tokenA)
    // needed(tokenA, pairAB) - platformFeeBtoA = needed(tokenA, pairAB) * platformFee(tokenA) / totalNeeded(tokenA)
    extendedPairInformation[i].platformFeeBToA = extendedPairInformation[i].neededTokenA
      .times(platformFeeByTokens.getPlatformFee(tokenA))
      .div(neededPerToken.get(tokenA));
  }
  log.warning('post platform fee', []);
  return extendedPairInformation;
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/main/contracts/DCAHub/DCAHubSwapHandler.sol#L55
export function convertAndApplyFee(from: Token, amount: BigInt, ratioFromTo: BigInt, fee: BigInt): BigInt {
  const numerator = applyFee(fee, amount.times(ratioFromTo));
  let amountTo = numerator.div(from.magnitude);
  if (numerator.mod(from.magnitude).notEqual(ZERO_BI)) amountTo = amountTo.plus(ONE_BI);
  return amountTo;
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/0fc7a600604c694e22b35bed53d7c7a12b8bca10/contracts/libraries/FeeMath.sol#L30
export function applyFee(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  return amount.times(FEE_PRECISION.minus(fee.div(BigInt.fromI32(100)))).div(FEE_PRECISION);
}

// On-chain ref.: https://github.com/Mean-Finance/dca-v2-core/blob/main/contracts/DCAHub/DCAHubSwapHandler.sol#L331
export function applyFeeWithExtraPrecision(fee: BigInt, amount: BigInt): BigInt {
  const FEE_PRECISION = BigInt.fromI32(10000);
  const feeAmount = amount.times(FEE_PRECISION.minus(fee.div(BigInt.fromI32(100))));
  return amount.minus(feeAmount);
}

export class PlatformFeeMap {
  private _tokensAddresses: Address[];
  private _platformFees: BigInt[];

  constructor() {
    this._tokensAddresses = [];
    this._platformFees = [];
  }

  addPlatformFee(token: Address, platformFee: BigInt): void {
    this._tokensAddresses.push(token);
    this._platformFees.push(platformFee);
  }

  getPlatformFee(tokenAddress: Address): BigInt {
    const indexOfFee = this._tokensAddresses.indexOf(tokenAddress);
    return this._platformFees[indexOfFee];
  }
}
