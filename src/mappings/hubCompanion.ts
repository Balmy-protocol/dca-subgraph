import * as transactionLibrary from '../utils/transaction';
import * as positionLibrary from '../utils/position';
import { ConvertedDeposit } from '../../generated/HubCompanion/HubCompanion';

export function handleConvertedDeposit(event: ConvertedDeposit): void {
  transactionLibrary.getOrCreateFromEvent(event, 'Deposited');
  positionLibrary.setAsEth(event);
}
