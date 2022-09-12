import { log, ethereum, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Transaction } from '../../generated/schema';

export function createIdFromHashAndIndexAndAction(hash: Bytes, index: BigInt, action: string): string {
  return hash.toHexString().concat('-').concat(index.toString()).concat('-').concat(action);
}

export function getOrCreateFromEvent(event: ethereum.Event, action: string): Transaction {
  log.info('[Transaction] Get or create transaction from event', []);
  const transaction = _getOrCreate(event.transaction, event.block, action);
  return transaction;
}

export function getOrCreateFromCall(call: ethereum.Call, action: string): Transaction {
  log.info('[Transaction] Get or create transaction from call', []);
  const transaction = _getOrCreate(call.transaction, call.block, action);
  return transaction;
}

function _getOrCreate(ethTransaction: ethereum.Transaction, block: ethereum.Block, action: string): Transaction {
  const id = createIdFromHashAndIndexAndAction(ethTransaction.hash, ethTransaction.index, action);
  log.info('[Transaction] Get or create {}', [id]);
  let transaction = Transaction.load(id);
  if (transaction == null) {
    transaction = new Transaction(id);
    transaction.from = ethTransaction.from;
    transaction.hash = ethTransaction.hash;
    transaction.index = ethTransaction.index;
    transaction.to = ethTransaction.to as Bytes;
    transaction.value = ethTransaction.value;
    transaction.timestamp = block.timestamp;
    transaction.blockNumber = block.number;
    transaction.event = action;
    transaction.save();
  }

  return transaction;
}
