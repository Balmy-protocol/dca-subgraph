// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class Approval extends ethereum.Event {
  get params(): Approval__Params {
    return new Approval__Params(this);
  }
}

export class Approval__Params {
  _event: Approval;

  constructor(event: Approval) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get approved(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class ApprovalForAll extends ethereum.Event {
  get params(): ApprovalForAll__Params {
    return new ApprovalForAll__Params(this);
  }
}

export class ApprovalForAll__Params {
  _event: ApprovalForAll;

  constructor(event: ApprovalForAll) {
    this._event = event;
  }

  get owner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get operator(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get approved(): boolean {
    return this._event.parameters[2].value.toBoolean();
  }
}

export class Deposited extends ethereum.Event {
  get params(): Deposited__Params {
    return new Deposited__Params(this);
  }
}

export class Deposited__Params {
  _event: Deposited;

  constructor(event: Deposited) {
    this._event = event;
  }

  get _user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _dcaId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get _fromToken(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get _rate(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get _startingSwap(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get _swapInterval(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }

  get _lastSwap(): BigInt {
    return this._event.parameters[6].value.toBigInt();
  }
}

export class Loaned extends ethereum.Event {
  get params(): Loaned__Params {
    return new Loaned__Params(this);
  }
}

export class Loaned__Params {
  _event: Loaned;

  constructor(event: Loaned) {
    this._event = event;
  }

  get _sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _to(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get _amountBorrowedTokenA(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get _amountBorrowedTokenB(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get _loanFee(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }
}

export class Modified extends ethereum.Event {
  get params(): Modified__Params {
    return new Modified__Params(this);
  }
}

export class Modified__Params {
  _event: Modified;

  constructor(event: Modified) {
    this._event = event;
  }

  get _user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _dcaId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get _rate(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get _startingSwap(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get _lastSwap(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }
}

export class Swapped extends ethereum.Event {
  get params(): Swapped__Params {
    return new Swapped__Params(this);
  }
}

export class Swapped__Params {
  _event: Swapped;

  constructor(event: Swapped) {
    this._event = event;
  }

  get _sender(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _to(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get _amountBorrowedTokenA(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get _amountBorrowedTokenB(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get _nextSwapInformation(): Swapped_nextSwapInformationStruct {
    return this._event.parameters[4].value.toTuple() as Swapped_nextSwapInformationStruct;
  }
}

export class Swapped_nextSwapInformationStruct extends ethereum.Tuple {
  get swapsToPerform(): Array<Swapped_nextSwapInformationSwapsToPerformStruct> {
    return this[0].toTupleArray<
      Swapped_nextSwapInformationSwapsToPerformStruct
    >();
  }

  get amountOfSwaps(): i32 {
    return this[1].toI32();
  }

  get availableToBorrowTokenA(): BigInt {
    return this[2].toBigInt();
  }

  get availableToBorrowTokenB(): BigInt {
    return this[3].toBigInt();
  }

  get ratePerUnitBToA(): BigInt {
    return this[4].toBigInt();
  }

  get ratePerUnitAToB(): BigInt {
    return this[5].toBigInt();
  }

  get platformFeeTokenA(): BigInt {
    return this[6].toBigInt();
  }

  get platformFeeTokenB(): BigInt {
    return this[7].toBigInt();
  }

  get amountToBeProvidedBySwapper(): BigInt {
    return this[8].toBigInt();
  }

  get amountToRewardSwapperWith(): BigInt {
    return this[9].toBigInt();
  }

  get tokenToBeProvidedBySwapper(): Address {
    return this[10].toAddress();
  }

  get tokenToRewardSwapperWith(): Address {
    return this[11].toAddress();
  }
}

export class Swapped_nextSwapInformationSwapsToPerformStruct extends ethereum.Tuple {
  get interval(): BigInt {
    return this[0].toBigInt();
  }

  get swapToPerform(): BigInt {
    return this[1].toBigInt();
  }

  get amountToSwapTokenA(): BigInt {
    return this[2].toBigInt();
  }

  get amountToSwapTokenB(): BigInt {
    return this[3].toBigInt();
  }
}

export class Terminated extends ethereum.Event {
  get params(): Terminated__Params {
    return new Terminated__Params(this);
  }
}

export class Terminated__Params {
  _event: Terminated;

  constructor(event: Terminated) {
    this._event = event;
  }

  get _user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _dcaId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get _returnedUnswapped(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get _returnedSwapped(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Transfer extends ethereum.Event {
  get params(): Transfer__Params {
    return new Transfer__Params(this);
  }
}

export class Transfer__Params {
  _event: Transfer;

  constructor(event: Transfer) {
    this._event = event;
  }

  get from(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get to(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Withdrew extends ethereum.Event {
  get params(): Withdrew__Params {
    return new Withdrew__Params(this);
  }
}

export class Withdrew__Params {
  _event: Withdrew;

  constructor(event: Withdrew) {
    this._event = event;
  }

  get _user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _dcaId(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get _token(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get _amount(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class WithdrewMany extends ethereum.Event {
  get params(): WithdrewMany__Params {
    return new WithdrewMany__Params(this);
  }
}

export class WithdrewMany__Params {
  _event: WithdrewMany;

  constructor(event: WithdrewMany) {
    this._event = event;
  }

  get _user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get _dcaIds(): Array<BigInt> {
    return this._event.parameters[1].value.toBigIntArray();
  }

  get _swappedTokenA(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get _swappedTokenB(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Pair__getNextSwapInfoResult_nextSwapInformationStruct extends ethereum.Tuple {
  get swapsToPerform(): Array<
    Pair__getNextSwapInfoResult_nextSwapInformationSwapsToPerformStruct
  > {
    return this[0].toTupleArray<
      Pair__getNextSwapInfoResult_nextSwapInformationSwapsToPerformStruct
    >();
  }

  get amountOfSwaps(): i32 {
    return this[1].toI32();
  }

  get availableToBorrowTokenA(): BigInt {
    return this[2].toBigInt();
  }

  get availableToBorrowTokenB(): BigInt {
    return this[3].toBigInt();
  }

  get ratePerUnitBToA(): BigInt {
    return this[4].toBigInt();
  }

  get ratePerUnitAToB(): BigInt {
    return this[5].toBigInt();
  }

  get platformFeeTokenA(): BigInt {
    return this[6].toBigInt();
  }

  get platformFeeTokenB(): BigInt {
    return this[7].toBigInt();
  }

  get amountToBeProvidedBySwapper(): BigInt {
    return this[8].toBigInt();
  }

  get amountToRewardSwapperWith(): BigInt {
    return this[9].toBigInt();
  }

  get tokenToBeProvidedBySwapper(): Address {
    return this[10].toAddress();
  }

  get tokenToRewardSwapperWith(): Address {
    return this[11].toAddress();
  }
}

export class Pair__getNextSwapInfoResult_nextSwapInformationSwapsToPerformStruct extends ethereum.Tuple {
  get interval(): BigInt {
    return this[0].toBigInt();
  }

  get swapToPerform(): BigInt {
    return this[1].toBigInt();
  }

  get amountToSwapTokenA(): BigInt {
    return this[2].toBigInt();
  }

  get amountToSwapTokenB(): BigInt {
    return this[3].toBigInt();
  }
}

export class Pair__userPositionResult_userPositionStruct extends ethereum.Tuple {
  get from(): Address {
    return this[0].toAddress();
  }

  get to(): Address {
    return this[1].toAddress();
  }

  get swapInterval(): BigInt {
    return this[2].toBigInt();
  }

  get swapsExecuted(): BigInt {
    return this[3].toBigInt();
  }

  get swapped(): BigInt {
    return this[4].toBigInt();
  }

  get swapsLeft(): BigInt {
    return this[5].toBigInt();
  }

  get remaining(): BigInt {
    return this[6].toBigInt();
  }

  get rate(): BigInt {
    return this[7].toBigInt();
  }
}

export class Pair__withdrawSwappedManyResult {
  value0: BigInt;
  value1: BigInt;

  constructor(value0: BigInt, value1: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    return map;
  }
}

export class Pair extends ethereum.SmartContract {
  static bind(address: Address): Pair {
    return new Pair("Pair", address);
  }

  activeSwapIntervals(): Array<BigInt> {
    let result = super.call(
      "activeSwapIntervals",
      "activeSwapIntervals():(uint32[])",
      []
    );

    return result[0].toBigIntArray();
  }

  try_activeSwapIntervals(): ethereum.CallResult<Array<BigInt>> {
    let result = super.tryCall(
      "activeSwapIntervals",
      "activeSwapIntervals():(uint32[])",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigIntArray());
  }

  balanceOf(owner: Address): BigInt {
    let result = super.call("balanceOf", "balanceOf(address):(uint256)", [
      ethereum.Value.fromAddress(owner)
    ]);

    return result[0].toBigInt();
  }

  try_balanceOf(owner: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("balanceOf", "balanceOf(address):(uint256)", [
      ethereum.Value.fromAddress(owner)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  deposit(
    _tokenAddress: Address,
    _rate: BigInt,
    _amountOfSwaps: BigInt,
    _swapInterval: BigInt
  ): BigInt {
    let result = super.call(
      "deposit",
      "deposit(address,uint160,uint32,uint32):(uint256)",
      [
        ethereum.Value.fromAddress(_tokenAddress),
        ethereum.Value.fromUnsignedBigInt(_rate),
        ethereum.Value.fromUnsignedBigInt(_amountOfSwaps),
        ethereum.Value.fromUnsignedBigInt(_swapInterval)
      ]
    );

    return result[0].toBigInt();
  }

  try_deposit(
    _tokenAddress: Address,
    _rate: BigInt,
    _amountOfSwaps: BigInt,
    _swapInterval: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "deposit",
      "deposit(address,uint160,uint32,uint32):(uint256)",
      [
        ethereum.Value.fromAddress(_tokenAddress),
        ethereum.Value.fromUnsignedBigInt(_rate),
        ethereum.Value.fromUnsignedBigInt(_amountOfSwaps),
        ethereum.Value.fromUnsignedBigInt(_swapInterval)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getApproved(tokenId: BigInt): Address {
    let result = super.call("getApproved", "getApproved(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(tokenId)
    ]);

    return result[0].toAddress();
  }

  try_getApproved(tokenId: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getApproved",
      "getApproved(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(tokenId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getNextSwapInfo(): Pair__getNextSwapInfoResult_nextSwapInformationStruct {
    let result = super.call(
      "getNextSwapInfo",
      "getNextSwapInfo():(((uint32,uint32,uint256,uint256)[],uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address))",
      []
    );

    return result[0].toTuple() as Pair__getNextSwapInfoResult_nextSwapInformationStruct;
  }

  try_getNextSwapInfo(): ethereum.CallResult<
    Pair__getNextSwapInfoResult_nextSwapInformationStruct
  > {
    let result = super.tryCall(
      "getNextSwapInfo",
      "getNextSwapInfo():(((uint32,uint32,uint256,uint256)[],uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address))",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      value[0].toTuple() as Pair__getNextSwapInfoResult_nextSwapInformationStruct
    );
  }

  globalParameters(): Address {
    let result = super.call(
      "globalParameters",
      "globalParameters():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_globalParameters(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "globalParameters",
      "globalParameters():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  isApprovedForAll(owner: Address, operator: Address): boolean {
    let result = super.call(
      "isApprovedForAll",
      "isApprovedForAll(address,address):(bool)",
      [ethereum.Value.fromAddress(owner), ethereum.Value.fromAddress(operator)]
    );

    return result[0].toBoolean();
  }

  try_isApprovedForAll(
    owner: Address,
    operator: Address
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "isApprovedForAll",
      "isApprovedForAll(address,address):(bool)",
      [ethereum.Value.fromAddress(owner), ethereum.Value.fromAddress(operator)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  name(): string {
    let result = super.call("name", "name():(string)", []);

    return result[0].toString();
  }

  try_name(): ethereum.CallResult<string> {
    let result = super.tryCall("name", "name():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  nextSwapAvailable(param0: BigInt): BigInt {
    let result = super.call(
      "nextSwapAvailable",
      "nextSwapAvailable(uint32):(uint32)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );

    return result[0].toBigInt();
  }

  try_nextSwapAvailable(param0: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "nextSwapAvailable",
      "nextSwapAvailable(uint32):(uint32)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  oracle(): Address {
    let result = super.call("oracle", "oracle():(address)", []);

    return result[0].toAddress();
  }

  try_oracle(): ethereum.CallResult<Address> {
    let result = super.tryCall("oracle", "oracle():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  ownerOf(tokenId: BigInt): Address {
    let result = super.call("ownerOf", "ownerOf(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(tokenId)
    ]);

    return result[0].toAddress();
  }

  try_ownerOf(tokenId: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall("ownerOf", "ownerOf(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(tokenId)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  performedSwaps(param0: BigInt): BigInt {
    let result = super.call(
      "performedSwaps",
      "performedSwaps(uint32):(uint32)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );

    return result[0].toBigInt();
  }

  try_performedSwaps(param0: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "performedSwaps",
      "performedSwaps(uint32):(uint32)",
      [ethereum.Value.fromUnsignedBigInt(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  secondsUntilNextSwap(): BigInt {
    let result = super.call(
      "secondsUntilNextSwap",
      "secondsUntilNextSwap():(uint32)",
      []
    );

    return result[0].toBigInt();
  }

  try_secondsUntilNextSwap(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "secondsUntilNextSwap",
      "secondsUntilNextSwap():(uint32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  supportsInterface(interfaceId: Bytes): boolean {
    let result = super.call(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );

    return result[0].toBoolean();
  }

  try_supportsInterface(interfaceId: Bytes): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "supportsInterface",
      "supportsInterface(bytes4):(bool)",
      [ethereum.Value.fromFixedBytes(interfaceId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  swapAmountAccumulator(param0: BigInt, param1: Address): BigInt {
    let result = super.call(
      "swapAmountAccumulator",
      "swapAmountAccumulator(uint32,address):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromAddress(param1)
      ]
    );

    return result[0].toBigInt();
  }

  try_swapAmountAccumulator(
    param0: BigInt,
    param1: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "swapAmountAccumulator",
      "swapAmountAccumulator(uint32,address):(uint256)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromAddress(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  swapAmountDelta(param0: BigInt, param1: Address, param2: BigInt): BigInt {
    let result = super.call(
      "swapAmountDelta",
      "swapAmountDelta(uint32,address,uint32):(int256)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );

    return result[0].toBigInt();
  }

  try_swapAmountDelta(
    param0: BigInt,
    param1: Address,
    param2: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "swapAmountDelta",
      "swapAmountDelta(uint32,address,uint32):(int256)",
      [
        ethereum.Value.fromUnsignedBigInt(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  symbol(): string {
    let result = super.call("symbol", "symbol():(string)", []);

    return result[0].toString();
  }

  try_symbol(): ethereum.CallResult<string> {
    let result = super.tryCall("symbol", "symbol():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  tokenA(): Address {
    let result = super.call("tokenA", "tokenA():(address)", []);

    return result[0].toAddress();
  }

  try_tokenA(): ethereum.CallResult<Address> {
    let result = super.tryCall("tokenA", "tokenA():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  tokenB(): Address {
    let result = super.call("tokenB", "tokenB():(address)", []);

    return result[0].toAddress();
  }

  try_tokenB(): ethereum.CallResult<Address> {
    let result = super.tryCall("tokenB", "tokenB():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  tokenURI(tokenId: BigInt): string {
    let result = super.call("tokenURI", "tokenURI(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(tokenId)
    ]);

    return result[0].toString();
  }

  try_tokenURI(tokenId: BigInt): ethereum.CallResult<string> {
    let result = super.tryCall("tokenURI", "tokenURI(uint256):(string)", [
      ethereum.Value.fromUnsignedBigInt(tokenId)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  userPosition(_dcaId: BigInt): Pair__userPositionResult_userPositionStruct {
    let result = super.call(
      "userPosition",
      "userPosition(uint256):((address,address,uint32,uint32,uint256,uint32,uint256,uint160))",
      [ethereum.Value.fromUnsignedBigInt(_dcaId)]
    );

    return result[0].toTuple() as Pair__userPositionResult_userPositionStruct;
  }

  try_userPosition(
    _dcaId: BigInt
  ): ethereum.CallResult<Pair__userPositionResult_userPositionStruct> {
    let result = super.tryCall(
      "userPosition",
      "userPosition(uint256):((address,address,uint32,uint32,uint256,uint32,uint256,uint160))",
      [ethereum.Value.fromUnsignedBigInt(_dcaId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      value[0].toTuple() as Pair__userPositionResult_userPositionStruct
    );
  }

  withdrawSwapped(_dcaId: BigInt): BigInt {
    let result = super.call(
      "withdrawSwapped",
      "withdrawSwapped(uint256):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(_dcaId)]
    );

    return result[0].toBigInt();
  }

  try_withdrawSwapped(_dcaId: BigInt): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "withdrawSwapped",
      "withdrawSwapped(uint256):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(_dcaId)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  withdrawSwappedMany(_dcaIds: Array<BigInt>): Pair__withdrawSwappedManyResult {
    let result = super.call(
      "withdrawSwappedMany",
      "withdrawSwappedMany(uint256[]):(uint256,uint256)",
      [ethereum.Value.fromUnsignedBigIntArray(_dcaIds)]
    );

    return new Pair__withdrawSwappedManyResult(
      result[0].toBigInt(),
      result[1].toBigInt()
    );
  }

  try_withdrawSwappedMany(
    _dcaIds: Array<BigInt>
  ): ethereum.CallResult<Pair__withdrawSwappedManyResult> {
    let result = super.tryCall(
      "withdrawSwappedMany",
      "withdrawSwappedMany(uint256[]):(uint256,uint256)",
      [ethereum.Value.fromUnsignedBigIntArray(_dcaIds)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Pair__withdrawSwappedManyResult(
        value[0].toBigInt(),
        value[1].toBigInt()
      )
    );
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _globalParameters(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _oracle(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _tokenA(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _tokenB(): Address {
    return this._call.inputValues[3].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class AddFundsToPositionCall extends ethereum.Call {
  get inputs(): AddFundsToPositionCall__Inputs {
    return new AddFundsToPositionCall__Inputs(this);
  }

  get outputs(): AddFundsToPositionCall__Outputs {
    return new AddFundsToPositionCall__Outputs(this);
  }
}

export class AddFundsToPositionCall__Inputs {
  _call: AddFundsToPositionCall;

  constructor(call: AddFundsToPositionCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _amount(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _newSwaps(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class AddFundsToPositionCall__Outputs {
  _call: AddFundsToPositionCall;

  constructor(call: AddFundsToPositionCall) {
    this._call = call;
  }
}

export class ApproveCall extends ethereum.Call {
  get inputs(): ApproveCall__Inputs {
    return new ApproveCall__Inputs(this);
  }

  get outputs(): ApproveCall__Outputs {
    return new ApproveCall__Outputs(this);
  }
}

export class ApproveCall__Inputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }

  get to(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ApproveCall__Outputs {
  _call: ApproveCall;

  constructor(call: ApproveCall) {
    this._call = call;
  }
}

export class DepositCall extends ethereum.Call {
  get inputs(): DepositCall__Inputs {
    return new DepositCall__Inputs(this);
  }

  get outputs(): DepositCall__Outputs {
    return new DepositCall__Outputs(this);
  }
}

export class DepositCall__Inputs {
  _call: DepositCall;

  constructor(call: DepositCall) {
    this._call = call;
  }

  get _tokenAddress(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _rate(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _amountOfSwaps(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get _swapInterval(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }
}

export class DepositCall__Outputs {
  _call: DepositCall;

  constructor(call: DepositCall) {
    this._call = call;
  }

  get value0(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }
}

export class LoanCall extends ethereum.Call {
  get inputs(): LoanCall__Inputs {
    return new LoanCall__Inputs(this);
  }

  get outputs(): LoanCall__Outputs {
    return new LoanCall__Outputs(this);
  }
}

export class LoanCall__Inputs {
  _call: LoanCall;

  constructor(call: LoanCall) {
    this._call = call;
  }

  get _amountToBorrowTokenA(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _amountToBorrowTokenB(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _to(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _data(): Bytes {
    return this._call.inputValues[3].value.toBytes();
  }
}

export class LoanCall__Outputs {
  _call: LoanCall;

  constructor(call: LoanCall) {
    this._call = call;
  }
}

export class ModifyRateCall extends ethereum.Call {
  get inputs(): ModifyRateCall__Inputs {
    return new ModifyRateCall__Inputs(this);
  }

  get outputs(): ModifyRateCall__Outputs {
    return new ModifyRateCall__Outputs(this);
  }
}

export class ModifyRateCall__Inputs {
  _call: ModifyRateCall;

  constructor(call: ModifyRateCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _newRate(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ModifyRateCall__Outputs {
  _call: ModifyRateCall;

  constructor(call: ModifyRateCall) {
    this._call = call;
  }
}

export class ModifyRateAndSwapsCall extends ethereum.Call {
  get inputs(): ModifyRateAndSwapsCall__Inputs {
    return new ModifyRateAndSwapsCall__Inputs(this);
  }

  get outputs(): ModifyRateAndSwapsCall__Outputs {
    return new ModifyRateAndSwapsCall__Outputs(this);
  }
}

export class ModifyRateAndSwapsCall__Inputs {
  _call: ModifyRateAndSwapsCall;

  constructor(call: ModifyRateAndSwapsCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _newRate(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _newAmountOfSwaps(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class ModifyRateAndSwapsCall__Outputs {
  _call: ModifyRateAndSwapsCall;

  constructor(call: ModifyRateAndSwapsCall) {
    this._call = call;
  }
}

export class ModifySwapsCall extends ethereum.Call {
  get inputs(): ModifySwapsCall__Inputs {
    return new ModifySwapsCall__Inputs(this);
  }

  get outputs(): ModifySwapsCall__Outputs {
    return new ModifySwapsCall__Outputs(this);
  }
}

export class ModifySwapsCall__Inputs {
  _call: ModifySwapsCall;

  constructor(call: ModifySwapsCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _newSwaps(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ModifySwapsCall__Outputs {
  _call: ModifySwapsCall;

  constructor(call: ModifySwapsCall) {
    this._call = call;
  }
}

export class SafeTransferFromCall extends ethereum.Call {
  get inputs(): SafeTransferFromCall__Inputs {
    return new SafeTransferFromCall__Inputs(this);
  }

  get outputs(): SafeTransferFromCall__Outputs {
    return new SafeTransferFromCall__Outputs(this);
  }
}

export class SafeTransferFromCall__Inputs {
  _call: SafeTransferFromCall;

  constructor(call: SafeTransferFromCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class SafeTransferFromCall__Outputs {
  _call: SafeTransferFromCall;

  constructor(call: SafeTransferFromCall) {
    this._call = call;
  }
}

export class SafeTransferFrom1Call extends ethereum.Call {
  get inputs(): SafeTransferFrom1Call__Inputs {
    return new SafeTransferFrom1Call__Inputs(this);
  }

  get outputs(): SafeTransferFrom1Call__Outputs {
    return new SafeTransferFrom1Call__Outputs(this);
  }
}

export class SafeTransferFrom1Call__Inputs {
  _call: SafeTransferFrom1Call;

  constructor(call: SafeTransferFrom1Call) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get _data(): Bytes {
    return this._call.inputValues[3].value.toBytes();
  }
}

export class SafeTransferFrom1Call__Outputs {
  _call: SafeTransferFrom1Call;

  constructor(call: SafeTransferFrom1Call) {
    this._call = call;
  }
}

export class SetApprovalForAllCall extends ethereum.Call {
  get inputs(): SetApprovalForAllCall__Inputs {
    return new SetApprovalForAllCall__Inputs(this);
  }

  get outputs(): SetApprovalForAllCall__Outputs {
    return new SetApprovalForAllCall__Outputs(this);
  }
}

export class SetApprovalForAllCall__Inputs {
  _call: SetApprovalForAllCall;

  constructor(call: SetApprovalForAllCall) {
    this._call = call;
  }

  get operator(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get approved(): boolean {
    return this._call.inputValues[1].value.toBoolean();
  }
}

export class SetApprovalForAllCall__Outputs {
  _call: SetApprovalForAllCall;

  constructor(call: SetApprovalForAllCall) {
    this._call = call;
  }
}

export class SwapCall extends ethereum.Call {
  get inputs(): SwapCall__Inputs {
    return new SwapCall__Inputs(this);
  }

  get outputs(): SwapCall__Outputs {
    return new SwapCall__Outputs(this);
  }
}

export class SwapCall__Inputs {
  _call: SwapCall;

  constructor(call: SwapCall) {
    this._call = call;
  }

  get _amountToBorrowTokenA(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _amountToBorrowTokenB(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _to(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _data(): Bytes {
    return this._call.inputValues[3].value.toBytes();
  }
}

export class SwapCall__Outputs {
  _call: SwapCall;

  constructor(call: SwapCall) {
    this._call = call;
  }
}

export class Swap1Call extends ethereum.Call {
  get inputs(): Swap1Call__Inputs {
    return new Swap1Call__Inputs(this);
  }

  get outputs(): Swap1Call__Outputs {
    return new Swap1Call__Outputs(this);
  }
}

export class Swap1Call__Inputs {
  _call: Swap1Call;

  constructor(call: Swap1Call) {
    this._call = call;
  }
}

export class Swap1Call__Outputs {
  _call: Swap1Call;

  constructor(call: Swap1Call) {
    this._call = call;
  }
}

export class TerminateCall extends ethereum.Call {
  get inputs(): TerminateCall__Inputs {
    return new TerminateCall__Inputs(this);
  }

  get outputs(): TerminateCall__Outputs {
    return new TerminateCall__Outputs(this);
  }
}

export class TerminateCall__Inputs {
  _call: TerminateCall;

  constructor(call: TerminateCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class TerminateCall__Outputs {
  _call: TerminateCall;

  constructor(call: TerminateCall) {
    this._call = call;
  }
}

export class TransferFromCall extends ethereum.Call {
  get inputs(): TransferFromCall__Inputs {
    return new TransferFromCall__Inputs(this);
  }

  get outputs(): TransferFromCall__Outputs {
    return new TransferFromCall__Outputs(this);
  }
}

export class TransferFromCall__Inputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }

  get from(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get tokenId(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class TransferFromCall__Outputs {
  _call: TransferFromCall;

  constructor(call: TransferFromCall) {
    this._call = call;
  }
}

export class WithdrawSwappedCall extends ethereum.Call {
  get inputs(): WithdrawSwappedCall__Inputs {
    return new WithdrawSwappedCall__Inputs(this);
  }

  get outputs(): WithdrawSwappedCall__Outputs {
    return new WithdrawSwappedCall__Outputs(this);
  }
}

export class WithdrawSwappedCall__Inputs {
  _call: WithdrawSwappedCall;

  constructor(call: WithdrawSwappedCall) {
    this._call = call;
  }

  get _dcaId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class WithdrawSwappedCall__Outputs {
  _call: WithdrawSwappedCall;

  constructor(call: WithdrawSwappedCall) {
    this._call = call;
  }

  get _swapped(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }
}

export class WithdrawSwappedManyCall extends ethereum.Call {
  get inputs(): WithdrawSwappedManyCall__Inputs {
    return new WithdrawSwappedManyCall__Inputs(this);
  }

  get outputs(): WithdrawSwappedManyCall__Outputs {
    return new WithdrawSwappedManyCall__Outputs(this);
  }
}

export class WithdrawSwappedManyCall__Inputs {
  _call: WithdrawSwappedManyCall;

  constructor(call: WithdrawSwappedManyCall) {
    this._call = call;
  }

  get _dcaIds(): Array<BigInt> {
    return this._call.inputValues[0].value.toBigIntArray();
  }
}

export class WithdrawSwappedManyCall__Outputs {
  _call: WithdrawSwappedManyCall;

  constructor(call: WithdrawSwappedManyCall) {
    this._call = call;
  }

  get _swappedTokenA(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }

  get _swappedTokenB(): BigInt {
    return this._call.outputValues[1].value.toBigInt();
  }
}