import { log, ethereum, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Transaction } from '../../generated/schema';

export function createIdFromHashAndIndex(hash: Bytes, index: BigInt): string {
  return hash.toHexString().concat('-').concat(index.toString());
}

export function getOrCreateFromEvent(event: ethereum.Event, action: string): Transaction {
  log.info('[Transaction] Get or create transaction from event', []);
  let transaction = _getOrCreate(event.transaction, event.block, action);
  return transaction;
}

export function getOrCreateFromCall(call: ethereum.Call, action: string): Transaction {
  log.info('[Transaction] Get or create transaction from call', []);
  let transaction = _getOrCreate(call.transaction, call.block, action);
  return transaction;
}

function _getOrCreate(ethTransaction: ethereum.Transaction, block: ethereum.Block, action: string): Transaction {
  let id = createIdFromHashAndIndex(ethTransaction.hash, ethTransaction.index);
  log.info('[Transaction] Get or create {}', [id]);
  let transaction = Transaction.load(id);
  if (transaction == null) {
    transaction = new Transaction(id);
    transaction.from = ethTransaction.from;
    // transaction.gasPrice = ethTransaction.gasPrice;
    // transaction.gasSent = ethTransaction.gasUsed;
    transaction.hash = ethTransaction.hash;
    transaction.index = ethTransaction.index;
    transaction.to = ethTransaction.to as Bytes;
    transaction.value = ethTransaction.value;
    transaction.timestamp = block.timestamp;
    // transaction.gasLimit = block.gasLimit;
    transaction.blockNumber = block.number;
    transaction.event = action;
    transaction.save();
  }

  return transaction!;
}
