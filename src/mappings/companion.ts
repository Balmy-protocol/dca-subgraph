import { log } from '@graphprotocol/graph-ts';
import { DepositUsingProtocolTokenCall } from '../../generated/Companion/Companion';
import * as positionLibrary from '../utils/position';
import * as transactionLibrary from '../utils/transaction';

// fromToken: Address,
// toToken: Address,
// amount: BigInt,
// amountOfSwaps: BigInt,
// swapInterval: BigInt,
// owner: Address,
// positionId: BigInt,

export function handleDepositUsingProtocolToken(call: DepositUsingProtocolTokenCall): void {
  // let transaction = transactionLibrary.getOrCreateFromCall(call, 'Companion-Deposited-Protocol-Token');
  // log.error('hash {}', [call.transaction.hash.toString()]);
}
