import * as transactionLibrary from '../utils/transaction';
import * as positionLibrary from '../utils/position';
import { Approval, ApprovalForAll, Modified, Transfer } from '../../generated/PermissionsManager/PermissionsManager';
import { ADDRESS_ZERO } from '../utils/constants';

export function handleTransfer(event: Transfer): void {
  let to = event.params.to.toHexString();
  let from = event.params.from.toHexString();

  if (to != ADDRESS_ZERO && from != ADDRESS_ZERO) {
    let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Transfer');
    positionLibrary.transfer(event, transaction);
  }
}

export function handleApproval(event: Approval): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Approval');
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'ApprovalForAll');
}

export function handleModified(event: Modified): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Modified');
}
