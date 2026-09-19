import { ObservablePlayerState, PlayerBelief } from '../game/types';

export interface DecisionProvider {
  name: string;
  evaluatePlayer(state: ObservablePlayerState): Promise<PlayerBelief>;
}
