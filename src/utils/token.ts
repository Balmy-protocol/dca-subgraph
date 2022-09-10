import { Address, log, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';
import { ERC20 } from '../../generated/Hub/ERC20';
import { Transformer } from '../../generated/Hub/Transformer';
import { TransformerRegistry } from '../../generated/Hub/TransformerRegistry';
import { PROTOCOL_TOKEN_ADDRESS } from './constants';

export const TRANSFORMER_REGISTRY_ADDRESS = Address.fromString('0xa57C9aCD776d8f96Fcf99fA9559B5d2f1c022925');
// WETH / WMATIC / ETC
export const PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS = Address.fromString('0x70fB4b2f99d22dB5B7D1691c4430EEAaE3bB166D');
// Yield bearing shares is a more human way of referring to 4626 transformer.
export const YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS = Address.fromString('0xe073b2a7736E581A5ea33152D64Adc374d707F97');

export function getById(id: string): Token {
  log.info('[Token] Get {}', [id]);
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
  if (token === null) {
    if (tokenAddress.equals(PROTOCOL_TOKEN_ADDRESS)) {
      token = createProtocolToken();
    } else {
      token = new Token(id);
      const erc20Contract = ERC20.bind(tokenAddress);
      token.name = erc20Contract.name();
      token.symbol = erc20Contract.symbol();
      token.decimals = erc20Contract.decimals();
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
    dataSource.network() == 'arbitrum-rinkeby'
  ) {
    token.name = 'Ethereum';
    token.symbol = 'ETH';
  } else if (dataSource.network() == 'matic' || dataSource.network() == 'mumbai') {
    token.name = 'Matic';
    token.symbol = 'MATIC';
  }
  token.decimals = 18;
  token.magnitude = BigInt.fromI32(10).pow(18);
  token.allowed = false;
  token.type = 'BASE';
  return token;
}

export function getTokenTypeAndTransformerAddress(tokenAddress: Address): TokenTypeAndTransformerAddress {
  const transformerRegistry = TransformerRegistry.bind(TRANSFORMER_REGISTRY_ADDRESS);
  const transformerAddress = transformerRegistry.transformers([tokenAddress])[0];
  const tokenType = getTokenTypeByTransformerAddress(transformerAddress);
  return new TokenTypeAndTransformerAddress(tokenType, transformerAddress);
}

function getTokenTypeByTransformerAddress(transformerAddress: Address): string {
  if (transformerAddress.equals(PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS)) {
    return 'WRAPPED_PROTOCOL_TOKEN';
  } else if (transformerAddress.equals(YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS)) {
    return 'YIELD_BEARING_SHARE';
  }
  return 'BASE';
}

export function getUnderlyingTokenIds(transformerAddress: Address, dependantAddress: Address): string[] {
  const underlyingTokens: string[] = [];
  const transformer = Transformer.bind(transformerAddress);
  const underlyingTokenAddresses = transformer.getUnderlying(dependantAddress);
  for (let i: i32 = 0; i < underlyingTokenAddresses.length; i++) {
    const underlyingId = underlyingTokenAddresses[i].toHexString();
    const underlyingToken = Token.load(underlyingId);
    if (underlyingToken === null) getOrCreate(underlyingTokenAddresses[i], false);
    underlyingTokens.push(underlyingId);
  }
  return underlyingTokens;
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
