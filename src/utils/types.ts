import { BigInt } from '@graphprotocol/graph-ts';

export class ExtendedPairInformation {
  private _neededTokenA: BigInt;
  private _neededTokenB: BigInt;
  platformFeeAToB: BigInt;
  platformFeeBToA: BigInt;

  constructor(__neededTokenA: BigInt, __neededTokenB: BigInt, _platformFeeAToB: BigInt, _platformFeeBToA: BigInt) {
    this._neededTokenA = __neededTokenA;
    this._neededTokenB = __neededTokenB;
    this.platformFeeAToB = _platformFeeAToB;
    this.platformFeeBToA = _platformFeeBToA;
  }

  get neededTokenA(): BigInt {
    return this._neededTokenA;
  }

  get neededTokenB(): BigInt {
    return this._neededTokenB;
  }
}
