import { Address, ethereum } from '@graphprotocol/graph-ts';
import { createMockedFunction } from 'matchstick-as/assembly/index';
import { TRANSFORMER_REGISTRY_ADDRESS } from '../../src/utils/token';

export class MockTransformerRegistry {
  static transformers(beingTransformed: Address[], transformersToReturn: Address[]): void {
    createMockedFunction(TRANSFORMER_REGISTRY_ADDRESS, 'transformers', 'transformers(address[]):(address[])')
      .withArgs([ethereum.Value.fromAddressArray(beingTransformed)])
      .returns([ethereum.Value.fromAddressArray(transformersToReturn)]);
  }
}
