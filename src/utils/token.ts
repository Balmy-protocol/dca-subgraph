import { Address, log, BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';
import { ERC20 } from '../../generated/TransformerRegistry/ERC20';
import { Transformer } from '../../generated/TransformerRegistry/Transformer';
import {
  TransformerRegistry,
  TransformerRegistry__calculateTransformToUnderlyingResultValue0Struct,
} from '../../generated/TransformerRegistry/TransformerRegistry';
import { ADDRESS_ZERO, getKnown4626, PROTOCOL_TOKEN_ADDRESS } from './constants';

export const TRANSFORMER_REGISTRY_ADDRESS = Address.fromString('0xC0136591Df365611B1452B5F8823dEF69Ff3A685');
// WETH / WMATIC / ETC
export const PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS = Address.fromString('0xfd55b5A6F61f22c70f4A1d8e63d181c6D0a290c6');
// Yield bearing shares is a more human way of referring to 4626 transformer.
export const YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS = Address.fromString('0x7CbdcA3c992953bdd536BE234973686D758DAabc');

export function getById(id: string): Token {
  const token = Token.load(id);
  if (token == null) throw Error('Token not found');
  return token;
}

export function getByAddress(tokenAddress: Address): Token {
  return getById(tokenAddress.toHexString());
}

export function getOrCreate(tokenAddress: Address, allowed: boolean): Token {
  const id = tokenAddress.toHexString();
  log.info('[Tokens] Get or create {}', [id]);
  let token = Token.load(id);
  if (token == null) {
    if (tokenAddress.equals(PROTOCOL_TOKEN_ADDRESS)) {
      token = createProtocolToken();
    } else {
      token = new Token(id);
      const erc20Contract = ERC20.bind(tokenAddress);
      const name = erc20Contract.try_name();
      if (name.reverted) {
        log.error('[Tokens] Call reverted while trying to get name of token {}', [tokenAddress.toHexString()]);
        token.name = 'TBD';
      } else {
        token.name = name.value;
      }
      const symbol = erc20Contract.try_symbol();
      if (symbol.reverted) {
        log.error('[Tokens] Call reverted while trying to get symbol of token {}', [tokenAddress.toHexString()]);
        token.symbol = 'TBD';
      } else {
        token.symbol = symbol.value;
      }
      const decimals = erc20Contract.try_decimals();
      if (decimals.reverted) {
        log.error('[Tokens] Call reverted while trying to get decimals of token {}', [tokenAddress.toHexString()]);
        token.decimals = 18;
      } else {
        token.decimals = decimals.value;
      }
      token.magnitude = BigInt.fromI32(10).pow(erc20Contract.decimals() as u8);
      token.allowed = allowed;

      const tokenTypeAndTransformerAddress = getTokenTypeAndTransformerAddress(tokenAddress);
      token.type = tokenTypeAndTransformerAddress.tokenType;

      if (tokenTypeAndTransformerAddress.tokenType != 'BASE') {
        token.underlyingTokens = getUnderlyingTokenIds(tokenTypeAndTransformerAddress.transformerAddress, tokenAddress);
      }
    }

    token.save();
  } else {
    if (allowed != token.allowed) {
      token.allowed = allowed;
      token.save();
    }
  }

  return token;
}

export function createProtocolToken(): Token {
  const token = new Token(PROTOCOL_TOKEN_ADDRESS.toHexString());
  if (
    dataSource.network() == 'mainnet' ||
    dataSource.network() == 'optimism' ||
    dataSource.network() == 'optimism-kovan' ||
    dataSource.network() == 'arbitrum-one' ||
    dataSource.network() == 'arbitrum-rinkeby' ||
    dataSource.network() == 'base' ||
    dataSource.network() == 'base-testnet'
  ) {
    token.name = 'Ethereum';
    token.symbol = 'ETH';
  } else if (dataSource.network() == 'matic' || dataSource.network() == 'mumbai') {
    token.name = 'Matic';
    token.symbol = 'MATIC';
  } else if (dataSource.network() == 'bsc') {
    token.name = 'BNB';
    token.symbol = 'BNB';
  } else if (dataSource.network() == 'gnosis') {
    token.name = 'xDAI';
    token.symbol = 'xDAI';
  }
  token.decimals = 18;
  token.magnitude = BigInt.fromI32(10).pow(18);
  token.allowed = false;
  token.type = 'BASE';
  return token;
}

export function getTokenTypeAndTransformerAddress(tokenAddress: Address): TokenTypeAndTransformerAddress {
  // This is a patch / check if we did not add the token to the registry
  // before enabling the token, creating a position or swapping it
  const knownFortySixTwentySix = getKnown4626();
  if (knownFortySixTwentySix.has(dataSource.network()) && knownFortySixTwentySix[dataSource.network()].includes(tokenAddress)) {
    log.debug("[Token] We've detected {} to be a 4626 via our known addresses", [tokenAddress.toHexString()]);
    return new TokenTypeAndTransformerAddress('YIELD_BEARING_SHARE', YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS);
  }
  const transformerAddress = getTransformerAddress(tokenAddress)[0];
  const tokenType = getTokenTypeByTransformerAddress(transformerAddress);
  return new TokenTypeAndTransformerAddress(tokenType, transformerAddress);
}

export function getTransformerAddress(dependantTokenAddress: Address): Address[] {
  const transformerRegistry = TransformerRegistry.bind(TRANSFORMER_REGISTRY_ADDRESS);
  return transformerRegistry.transformers([dependantTokenAddress]);
}

function getTokenTypeByTransformerAddress(transformerAddress: Address): string {
  if (transformerAddress.equals(PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS)) {
    return 'WRAPPED_PROTOCOL_TOKEN';
  } else if (transformerAddress.equals(YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS)) {
    return 'YIELD_BEARING_SHARE';
  }
  return 'BASE';
}

export function getUnderlyingTokenIds(transformerAddress: Address, dependantTokenAddress: Address): string[] {
  const underlyingTokens: string[] = [];
  const transformer = Transformer.bind(transformerAddress);
  const underlyingTokenAddresses = transformer.getUnderlying(dependantTokenAddress);
  for (let i: i32 = 0; i < underlyingTokenAddresses.length; i++) {
    const underlyingId = underlyingTokenAddresses[i].toHexString();
    const underlyingToken = Token.load(underlyingId);
    if (underlyingToken == null) getOrCreate(underlyingTokenAddresses[i], false);
    underlyingTokens.push(underlyingId);
  }
  return underlyingTokens;
}

export function transformToUnderlying(
  dependantAddress: Address,
  amount: BigInt
): Array<TransformerRegistry__calculateTransformToUnderlyingResultValue0Struct> {
  const transformerRegistry = TransformerRegistry.bind(TRANSFORMER_REGISTRY_ADDRESS);
  const calculateTransformToUnderlying = transformerRegistry.try_calculateTransformToUnderlying(dependantAddress, amount);
  if (calculateTransformToUnderlying.reverted) {
    log.error('[Tokens] Error while calling calculate transform to underlying with {} {}', [
      dependantAddress.toHexString(),
      amount.toHexString(),
    ]);
    const response = new TransformerRegistry__calculateTransformToUnderlyingResultValue0Struct();
    response.push(ethereum.Value.fromAddress(ADDRESS_ZERO));
    response.push(ethereum.Value.fromUnsignedBigInt(amount));
    return [response];
  }
  return calculateTransformToUnderlying.value;
}

export function transformYieldBearingSharesToUnderlying(dependantTokenAddress: Address, amount: BigInt): BigInt {
  const underlyings = transformToUnderlying(dependantTokenAddress, amount);
  return underlyings[0].amount;
}

export class TokenTypeAndTransformerAddress {
  private _tokenType: string;
  private _transformerAddress: Address;

  constructor(tokenType: string, transformerAddress: Address) {
    this._tokenType = tokenType;
    this._transformerAddress = transformerAddress;
  }

  get tokenType(): string {
    return this._tokenType;
  }

  get transformerAddress(): Address {
    return this._transformerAddress;
  }
}
