import { Address, log, BigInt } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';
import { ERC20 } from '../../generated/Hub/ERC20';

const DEFAULT_DECIMALS = 18;

export function get(id: string): Token {
  log.info('[Token] Get {}', [id]);
  let token = Token.load(id);
  if (token == null) throw Error('Token not found');
  return token;
}

export function getOrCreate(address: Address, allowed: boolean): Token {
  let id = address.toHexString();
  log.info('[Tokens] Get or create {}', [id]);
  let token = Token.load(id);
  if (token === null) {
    token = new Token(id);
    let erc20Contract = ERC20.bind(address);
    token.name = erc20Contract.name();
    token.symbol = erc20Contract.symbol();
    token.allowed = allowed;
    token.magnitude = BigInt.fromI32(10).pow(erc20Contract.decimals() as u8);
    token.save();
  } else {
    if (allowed != token.allowed) {
      token.allowed = allowed;
      token.save();
    }
  }

  return token;
}
