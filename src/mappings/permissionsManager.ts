import * as transactionLibrary from '../utils/transaction';
import * as positionLibrary from '../utils/position';
import { Approval, ApprovalForAll, Modified, Transfer } from '../../generated/PermissionsManager/PermissionsManager';
import { ADDRESS_ZERO } from '../utils/constants';

export function handleTransfer(event: Transfer): void {
  let to = event.params.to;
  let from = event.params.from;

  if (to.notEqual(ADDRESS_ZERO) && from.notEqual(ADDRESS_ZERO)) {
    let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Transfer');
    positionLibrary.transfer(event, transaction);
  }
}

export function handleApproval(event: Approval): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Approval');
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-ApprovalForAll');
}

export function handleModified(event: Modified): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Modified');
  positionLibrary.permissionsModified(event, transaction);
}
