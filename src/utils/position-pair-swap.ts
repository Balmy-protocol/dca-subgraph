import { log, BigInt } from '@graphprotocol/graph-ts';
import { PairSwap, Position, PositionPairSwap, PositionState } from '../../generated/schema';

export function create(position: Position, positionState: PositionState, pairSwap: PairSwap, swapped: BigInt): PositionPairSwap {
  let positionPairSwapId = position.id.concat('-').concat(pairSwap.id);
  log.info('[PositionPairSwap] Create {}', [positionPairSwapId]);
  let positionPairSwap = PositionPairSwap.load(positionPairSwapId);
  if (positionPairSwap == null) {
    positionPairSwap = new PositionPairSwap(positionPairSwapId);
    positionPairSwap.position = position.id;
    positionPairSwap.positionState = positionState.id;
    positionPairSwap.pairSwap = pairSwap.id;
    positionPairSwap.used = positionState.rate;
    positionPairSwap.swapped = swapped;
    positionPairSwap.save();
  }
  return positionPairSwap!;
}
