import { log, ethereum, BigInt, Bytes, dataSource, Address } from '@graphprotocol/graph-ts';
import { Transaction } from '../../generated/schema';
import { OVMGasPriceOracle } from '../../generated/TransformerRegistry/OVMGasPriceOracle';

// Optimism gas price oracle to calculate l1 gas price.
export const OVM_GAS_PRICE_ORACLE_ADDRESS = Address.fromString('0x420000000000000000000000000000000000000F');

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

export function calculateL1GasPrice(): BigInt {
  const ovmGasPriceOracle = OVMGasPriceOracle.bind(OVM_GAS_PRICE_ORACLE_ADDRESS);
  return ovmGasPriceOracle.l1BaseFee();
}
export function getFixedOverhead(): BigInt {
  const ovmGasPriceOracle = OVMGasPriceOracle.bind(OVM_GAS_PRICE_ORACLE_ADDRESS);
  return ovmGasPriceOracle.overhead();
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
    transaction.to = ethTransaction.to! as Bytes;
    transaction.value = ethTransaction.value;
    transaction.timestamp = block.timestamp;
    transaction.blockNumber = block.number;
    transaction.event = action;
    transaction.gasPrice = ethTransaction.gasPrice;
    transaction.l1GasPrice = null;
    transaction.overhead = null;

    if (dataSource.network() == 'optimism') {
      transaction.l1GasPrice = calculateL1GasPrice();
      transaction.overhead = getFixedOverhead();
    }

    transaction.save();
  }

  return transaction;
}
