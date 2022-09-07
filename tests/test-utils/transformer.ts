import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as/assembly/index';

export function mockTransformer(transformerAddress: Address, dependant: Address, underlyingTokens: Address[]): void {
  createMockedFunction(transformerAddress, 'getUnderlying', 'getUnderlying(address):(address[])')
    .withArgs([ethereum.Value.fromAddress(dependant)])
    .returns([ethereum.Value.fromAddressArray(underlyingTokens)]);
}
