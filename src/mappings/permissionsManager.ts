import * as transactionLibrary from '../utils/transaction';
import { Approval, ApprovalForAll, Modified, Transfer } from '../../generated/PermissionsManager/PermissionsManager';

export function handleTransfer(event: Transfer): void {
  let transaction = transactionLibrary.getOrCreateFromEvent(event, 'Transfer');
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