import * as transactionLibrary from '../utils/transaction';
import * as positionLibrary from '../utils/position';
import { Approval, ApprovalForAll, Modified, Transfer } from '../../generated/PermissionsManager/PermissionsManager';
import { ADDRESS_ZERO } from '../utils/constants';

export function handleTransfer(event: Transfer): void {
  const to = event.params.to;
  const from = event.params.from;

  if (to.notEqual(ADDRESS_ZERO) && from.notEqual(ADDRESS_ZERO)) {
    const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Transfer');
    positionLibrary.transfer(event, transaction);
  }
}

export function handleApproval(event: Approval): void {
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Approval');
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-ApprovalForAll');
}

export function handleModified(event: Modified): void {
  const transaction = transactionLibrary.getOrCreateFromEvent(event, 'Pm-Modified');
  positionLibrary.permissionsModified(event, transaction);
}
