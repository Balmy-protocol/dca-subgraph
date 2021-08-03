import { log, ethereum, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import { SwapInterval, GlobalParameter as GlobalParameters, Transaction } from '../../generated/schema';
import {
  GlobalParameters as GlobalParametersContract,
  SwapIntervalsAllowed,
  SwapIntervalsForbidden,
} from '../../generated/GlobalParameters/GlobalParameters';

export function getOrCreate(address: Address): GlobalParameters {
  let id = address.toHexString();
  log.warning('[GlobalParameters] Get or create {}', [id]);
  let globalParameters = GlobalParameters.load(id);
  if (globalParameters == null) {
    let globalParametersContract = GlobalParametersContract.bind(address);
    globalParameters = new GlobalParameters(id);
    globalParameters.feeRecipient = globalParametersContract.feeRecipient() as Bytes;
    globalParameters.nftDescriptor = globalParametersContract.nftDescriptor() as Bytes;
    globalParameters.swapFee = globalParametersContract.swapFee();
    globalParameters.loanFee = globalParametersContract.loanFee();
    globalParameters.FEE_PRECISION = globalParametersContract.FEE_PRECISION();
    globalParameters.MAX_FEE = globalParametersContract.MAX_FEE();
    globalParameters.save();
  }
  return globalParameters!;
}

export function addSwapIntervals(event: SwapIntervalsAllowed, transaction: Transaction): void {
  log.warning('[GlobalParameters] Add swap interval', []);
  let globalParameters = getOrCreate(event.address);
  let intervals = event.params._swapIntervals;
  let descriptions = event.params._descriptions;
  for (let i: i32 = 0; i < intervals.length; i++) {
    let swapIntervalId = intervals[i].toString();
    let swapInterval = SwapInterval.load(swapIntervalId);
    if (swapInterval == null) {
      swapInterval = new SwapInterval(swapIntervalId);
      swapInterval.globalParameters = globalParameters.id;
      swapInterval.interval = intervals[i];
    }
    swapInterval.description = descriptions[i];
    swapInterval.save();
  }
  // return globalParameters!;
}

export function removeSwapIntervals(event: SwapIntervalsForbidden, transaction: Transaction): void {
  log.warning('[GlobalParameters] Remove swap intervals', []);
  // let globalParameters = getOrCreate(event.address!);
  // for (let i = 0; i < event.params._swapIntervals.length; i++) {
  //   let swapIntervalId = transaction.id + i;
  //   let swapInterval = SwapInterval.load(swapIntervalId);
  //   if (swapInterval != null) {
  //     // TODO: delete
  //   }
  // }
  // return globalParameters!;
}
