import { TypeSafeClient } from '@typesafe-ai/sdk';
import { BehaviorType, ObservablePlayerState, PlayerBelief } from '../game/types';
import { DecisionProvider } from './provider';
import { JEV_QUESTIONS } from './questions';
import { normalizeBelief } from './normalize';
import { HeuristicDecisionProvider } from './heuristic-provider';

export class TypeSafeJevProvider implements DecisionProvider {
  name = 'TypeSafeJevEngine';
  private fallbackProvider = new HeuristicDecisionProvider();
  private client?: TypeSafeClient;

  constructor() {
    const apiKey = process.env.TYPESAFE_API_KEY;
    if (apiKey) {
      try {
        this.client = new TypeSafeClient({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize TypeSafeClient:', err);
      }
    }
  }

  async evaluatePlayer(state: ObservablePlayerState): Promise<PlayerBelief> {
    if (!this.client || !process.env.TYPESAFE_API_KEY) {
      // Fallback to heuristic provider when no API key is configured
      return this.fallbackProvider.evaluatePlayer(state);
    }

    try {
      // 1200ms hard timeout race
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TypeSafe Jev request timeout (1200ms)')), 1200)
      );

      const apiPromise = this.client.systemOne({
        state: {
          handIndex: state.handIndex,
          pot: state.pot,
          currentBet: state.currentBet,
          playerAction: state.player.currentAction,
          playerBetAmount: state.player.betAmount,
          actionDelayMs: state.player.actionDelayMs,
          patterns: state.patterns,
          recentHandsCount: state.recentHands.length,
          recentSummary: state.recentHands.map(h => ({
            action: h.playerAction,
            delay: h.actionDelayMs,
            won: h.won,
            revealedStrength: h.revealedHandStrength,
          })),
        } as unknown as Parameters<TypeSafeClient['systemOne']>[0]['state'],
        questions: JEV_QUESTIONS,
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const answers = response.answers;

      const behaviorAnswer = answers.behavior;
      const bluffAnswer = answers.bluff;
      const baitingAnswer = answers.baiting;
      const aggressionAnswer = answers.aggression;
      const predictabilityAnswer = answers.predictability;
      const tiltAnswer = answers.tilt;

      // Pad any missing BehaviorType keys with 0 for type safety
      const defaultProbs: Record<BehaviorType, number> = {
        STRONG_REPRESENTATION: 0, BLUFF_REPRESENTATION: 0, BAIT: 0,
        PROBE: 0, DEFENSIVE: 0, TILT: 0, UNCLEAR: 0,
        GENUINE_STRONG: 0, CALCULATED_BLUFF: 0,
        TEMPO_MANIPULATION: 0, DESPERATION_DIG: 0,
      };
      const mergedProbs: Record<BehaviorType, number> = {
        ...defaultProbs,
        ...behaviorAnswer.probabilities,
      };

      return normalizeBelief({
        behavior: {
          value: behaviorAnswer.choice as BehaviorType,
          probabilities: mergedProbs,
          confidence: behaviorAnswer.confidence,
        },
        bluff: bluffAnswer.noul,
        baiting: baitingAnswer.noul,
        // reversePrediction is derived from the tempo-manipulation
        // probability inside normalizeBelief.
        aggression: aggressionAnswer.score / 3,
        predictability: predictabilityAnswer.score / 3,
        tilt: tiltAnswer.score / 3,
      });
    } catch (err) {
      console.warn('TypeSafe Jev call failed or timed out, falling back to heuristic:', err);
      return this.fallbackProvider.evaluatePlayer(state);
    }
  }
}
