import { log } from '@graphprotocol/graph-ts';
import * as transactionLibrary from '../utils/transaction';
import * as tokenLibrary from '../utils/token';
import { Hub } from '../../generated/Hub/Hub';
import { TransformersRegistered } from '../../generated/Hub/TransformerRegistry';
import { HUB_ADDRESS } from '../utils/constants';
import { getTokenTypeAndTransformerAddress, getUnderlyingTokenIds } from '../utils/token';

export function handleTransformersRegistered(event: TransformersRegistered): void {
  log.info('[TransformerRegistry] Handle transformers registered', []);
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Tr-TransformersRegistered');
  const hub = Hub.bind(HUB_ADDRESS);
  let registrations = event.params.registrations;
  for (let i: i32 = 0; i < registrations.length; i++) {
    let dependents = registrations[i].dependents;
    for (let x: i32 = 0; x < dependents.length; x++) {
      // We should keep same allowed state
      const tokenAddress = dependents[x];
      const allowed = hub.allowedTokens(tokenAddress);
      const token = tokenLibrary.getOrCreate(dependents[x], allowed);
      const tokenTypeAndTransformerAddress = getTokenTypeAndTransformerAddress(tokenAddress);
      token.type = tokenTypeAndTransformerAddress.tokenType;

      if (tokenTypeAndTransformerAddress.tokenType != 'BASE') {
        token.underlyingTokens = getUnderlyingTokenIds(tokenTypeAndTransformerAddress.transformerAddress, tokenAddress);
      }
      token.save();
    }
  }
}
