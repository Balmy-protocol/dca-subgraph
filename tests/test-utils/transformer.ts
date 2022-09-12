import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as/assembly/index';
import { Transformer__calculateTransformToUnderlyingResultValue0Struct } from '../../generated/Hub/Transformer';

export class MockTransformer {
  static getUnderlying(transformerAddress: Address, dependantAddress: Address, underlyingTokensAddresses: Address[]): void {
    createMockedFunction(transformerAddress, 'getUnderlying', 'getUnderlying(address):(address[])')
      .withArgs([ethereum.Value.fromAddress(dependantAddress)])
      .returns([ethereum.Value.fromAddressArray(underlyingTokensAddresses)]);
  }
  static calculateTransformToUnderlying(
    transformerAddress: Address,
    dependantAddress: Address,
    dependantAmount: BigInt,
    underlying: Array<Transformer__calculateTransformToUnderlyingResultValue0Struct>
  ): void {
    createMockedFunction(
      transformerAddress,
      'calculateTransformToUnderlying',
      'calculateTransformToUnderlying(address,uint256):((address,uint256)[])'
    )
      .withArgs([ethereum.Value.fromAddress(dependantAddress), ethereum.Value.fromSignedBigInt(dependantAmount)])
      .returns([ethereum.Value.fromTupleArray(changetype<ethereum.Tuple[]>(underlying))]);
  }
}
