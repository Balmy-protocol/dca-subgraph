import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts';
import { assert, beforeEach, clearStore, dataSourceMock, describe, test } from 'matchstick-as';
import { Token } from '../../generated/schema';
import * as tokenLibrary from '../../src/utils/token';
import { createToken, mockTokenContract } from '../test-utils/token';
import { mockTransformerRegistry } from '../test-utils/transformer-registry';
import { mockTransformer } from '../test-utils/transformer';
import { ADDRESS_ZERO } from '../../src/utils/constants';

describe('Token library', () => {
  /* -------------------- Set ups environment for each test ------------------- */

  beforeEach(() => {
    clearStore();
    createToken(token1_address, token1_name, token1_symbol, token1_decimals, token1_allowed, token1_type, null);
  });

  /* ---------------------------------- Tests --------------------------------- */

  describe('getByAddress', () => {
    describe('when entity does not exist', () => {
      test(
        'then it throws',
        () => {
          tokenLibrary.getByAddress(Address.fromString('0x0000000000000000000000000000000000000069'));
        },
        true
      );
    });
    describe('when it does exist', () => {
      test('then it returns entity', () => {
        const token = tokenLibrary.getByAddress(token1_address);
        assert.stringEquals(token.id, token1_id);
      });
    });
  });

  describe('getById', () => {
    describe('when entity does not exist', () => {
      test(
        'then it throws',
        () => {
          tokenLibrary.getById('0x0000000000000000000000000000000000000069');
        },
        true
      );
    });
    describe('when it does exist', () => {
      test('then it returns entity', () => {
        const token = tokenLibrary.getById(token1_id);
        assert.stringEquals(token.id, token1_id);
      });
    });
  });

  describe('createProtocolToken', () => {
    describe('on ethereum', () => {
      beforeEach(() => {
        dataSourceMock.setNetwork('mainnet');
      });
      test('returns correct token entity', () => {
        assertProtocolToken(tokenLibrary.createProtocolToken(), 'Ethereum', 'ETH');
      });
    });
    describe('on matic', () => {
      beforeEach(() => {
        dataSourceMock.setNetwork('matic');
      });
      test('returns correct token entity', () => {
        assertProtocolToken(tokenLibrary.createProtocolToken(), 'Matic', 'MATIC');
      });
    });
  });

  describe('getTokenTypeAndTransformerAddress', () => {
    describe(`when token doesn't have a transformer assigned`, () => {
      beforeEach(() => {
        mockTransformerRegistry([token1_address], [ADDRESS_ZERO]);
      });
      test('then type is base and transformer address is zero', () => {
        const tokenTypeAndTransformer = tokenLibrary.getTokenTypeAndTransformerAddress(token1_address);
        assert.stringEquals(tokenTypeAndTransformer.tokenType, 'BASE');
        assert.addressEquals(tokenTypeAndTransformer.transformerAddress, ADDRESS_ZERO);
      });
    });
    describe(`when token has a transformer assigned`, () => {
      describe('and its the protocol wrapper transformer', () => {
        beforeEach(() => {
          mockTransformerRegistry([token1_address], [tokenLibrary.PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS]);
        });
        test('then type and transformer address are correct', () => {
          const tokenTypeAndTransformer = tokenLibrary.getTokenTypeAndTransformerAddress(token1_address);
          assert.stringEquals(tokenTypeAndTransformer.tokenType, 'WRAPPED_PROTOCOL_TOKEN');
          assert.addressEquals(tokenTypeAndTransformer.transformerAddress, tokenLibrary.PROTOCOL_TOKEN_WRAPPER_TRANSFORMER_ADDRESS);
        });
      });
      describe('and its the yield baring shares transformer', () => {
        beforeEach(() => {
          mockTransformerRegistry([token1_address], [tokenLibrary.YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS]);
        });
        test('then type and transformer address are correct', () => {
          const tokenTypeAndTransformer = tokenLibrary.getTokenTypeAndTransformerAddress(token1_address);
          assert.stringEquals(tokenTypeAndTransformer.tokenType, 'YIELD_BEARING_SHARE');
          assert.addressEquals(tokenTypeAndTransformer.transformerAddress, tokenLibrary.YIELD_BEARING_SHARE_TRANSFORMER_ADDRESS);
        });
      });
    });
  });

  describe('getUnderlyingTokenIds', () => {
    beforeEach(() => {
      mockTransformer(transformerAddress, dependantAddress, [token1_address]);
    });
    describe('when underlying token already exists', () => {
      test('returns correct underlying tokens', () => {
        assert.entityCount('Token', 1);
        const underlyingTokens = tokenLibrary.getUnderlyingTokenIds(transformerAddress, dependantAddress);
        assert.entityCount('Token', 1);
        assert.equals(ethereum.Value.fromStringArray(underlyingTokens), ethereum.Value.fromStringArray([token1_id]));
      });
    });
    describe(`when underlying token didnt exist`, () => {
      beforeEach(() => {
        store.remove('Token', token1_id);
        // Mock token contract on-chain
        mockTokenContract(token1_id, token1_name, token1_symbol, token1_decimals);
        // We indicate that the underlying is going to be a BASE token
        mockTransformerRegistry([token1_address], [ADDRESS_ZERO]);
      });
      test('creates underlying and returns them', () => {
        assert.entityCount('Token', 0);
        const underlyingTokens = tokenLibrary.getUnderlyingTokenIds(transformerAddress, dependantAddress);
        assert.entityCount('Token', 1);
        const token = Token.load(token1_id)!;
        assert.assertNotNull(token);
        assert.stringEquals(token.id, token1_id);
        assert.equals(ethereum.Value.fromStringArray(underlyingTokens), ethereum.Value.fromStringArray([token1_id]));
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const token1_address = Address.fromString('0x0000000000000000000000000000000000000001');
const token1_id = token1_address.toHexString();
const token1_name = 'Token 1';
const token1_symbol = 'T1';
const token1_decimals = 18;
const token1_allowed = false;
const token1_type = 'BASE';

const transformerAddress = Address.fromString('0x0000000000000000000000000000000000000420');
const dependantAddress = Address.fromString('0x6900000000000000000000000000000000000420');

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function assertProtocolToken(token: Token, name: string, symbol: string): void {
  assert.stringEquals(token.name, name);
  assert.stringEquals(token.symbol, symbol);
  assert.stringEquals(token.type, 'BASE');
  assert.i32Equals(token.decimals, 18);
  assert.bigIntEquals(token.magnitude, BigInt.fromI32(10).pow(18));
  assert.booleanEquals(token.allowed, false);
}
