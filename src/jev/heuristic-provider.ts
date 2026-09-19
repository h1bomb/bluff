import { BehaviorType, ObservablePlayerState, PlayerBelief } from '../game/types';
import { DecisionProvider } from './provider';
import { normalizeBelief } from './normalize';

/**
 * Heuristic AI decision provider optimized for 3-card poker roguelike.
 * Uses 4 sharp intent categories (matching JEV_QUESTIONS) to produce
 * high-confidence peaks that reliably trigger MODEL BREAK, Confirmation Bias,
 * and other cognitive multiplier mechanics.
 */
export class HeuristicDecisionProvider implements DecisionProvider {
  name = 'HeuristicDecisionEngine';

  async evaluatePlayer(state: ObservablePlayerState): Promise<PlayerBelief> {
    const { player, patterns, recentHands } = state;
    const isFastAction = player.actionDelayMs <= 800;
    const isSlowAction = player.actionDelayMs > 2500;
    const isAggressive = player.currentAction === 'RAISE' || player.currentAction === 'ALL_IN';

    // 4-class probability distribution (matches new JEV_QUESTIONS)
    let pGenuineStrong = 0.25;
    let pCalculatedBluff = 0.25;
    let pTempoManipulation = 0.25;
    let pDesperationDig = 0.25;

    // --- History-based pattern conditioning ---
    const fastPlayHistory = recentHands.filter(
      (h) => h.actionDelayMs <= 800
    ).length;
    const slowPlayHistory = recentHands.filter(
      (h) => h.actionDelayMs > 2500
    ).length;
    const recentWins = recentHands.filter((h) => h.won).length;
    const recentLosses = recentHands.filter((h) => !h.won).length;
    const hasStrongHistory = recentHands.some(
      (h) => h.showdown && (h.revealedHandStrength ?? 0) > 0.65
    );

    // --- Fast + aggressive: AI becomes convinced player is STRONG ---
    if (isAggressive && isFastAction) {
      if (fastPlayHistory >= 2 || patterns.repeatedSequences.some((s) => s.includes('FAST_RAISE'))) {
        // Conditioned habit: high confidence spike (exploitable by MODEL BREAK!)
        pGenuineStrong = 0.82;
        pCalculatedBluff = 0.08;
        pTempoManipulation = 0.06;
        pDesperationDig = 0.04;
      } else if (fastPlayHistory >= 1) {
        pGenuineStrong = 0.65;
        pCalculatedBluff = 0.15;
        pTempoManipulation = 0.12;
        pDesperationDig = 0.08;
      } else {
        pGenuineStrong = 0.52;
        pCalculatedBluff = 0.22;
        pTempoManipulation = 0.14;
        pDesperationDig = 0.12;
      }
    }

    // --- Slow action: careful calculation, sandbagging or desperation ---
    if (isSlowAction) {
      if (hasStrongHistory || recentWins >= 2) {
        // Proven strength: careful calculation / monster hand deliberation
        pGenuineStrong = Math.max(pGenuineStrong, 0.72);
        pCalculatedBluff = 0.14;
        pTempoManipulation = 0.10;
        pDesperationDig = 0.04;
      } else if (recentLosses >= 2) {
        // Struggling player stalling: genuine distress
        pDesperationDig = Math.max(pDesperationDig, 0.58);
        pTempoManipulation = Math.max(pTempoManipulation, 0.26);
        pGenuineStrong = Math.min(pGenuineStrong, 0.12);
      } else if (slowPlayHistory >= 1) {
        // Repeated slow play pattern
        pTempoManipulation = Math.max(pTempoManipulation, 0.55);
        pCalculatedBluff = 0.25;
        pGenuineStrong = 0.12;
        pDesperationDig = 0.08;
      } else {
        // Deliberate tempo manipulation
        pTempoManipulation = Math.max(pTempoManipulation, 0.45);
        pGenuineStrong = Math.max(pGenuineStrong, 0.35);
        pCalculatedBluff = 0.20;
      }
    }

    // --- Aggressive but not fast: calculated bluff or steady value play ---
    if (isAggressive && !isFastAction && !isSlowAction) {
      if (hasStrongHistory) {
        pGenuineStrong = Math.max(pGenuineStrong, 0.65);
        pCalculatedBluff = 0.20;
      } else {
        pCalculatedBluff = Math.max(pCalculatedBluff, 0.45);
        pGenuineStrong = Math.max(pGenuineStrong, 0.35);
      }
    }

    // --- Recent losses boost desperation read ---
    if (recentLosses >= 2 && recentWins === 0) {
      pDesperationDig += 0.30;
      pGenuineStrong = Math.max(0.10, pGenuineStrong - 0.15);
    }

    // --- If player previously revealed strong hands, boost strong prediction ---
    if (hasStrongHistory) {
      if (isFastAction) {
        pGenuineStrong = Math.max(pGenuineStrong, 0.85);
      } else {
        pGenuineStrong = Math.max(pGenuineStrong, 0.68);
      }
    }

    // --- Passive actions (CALL/FOLD in classic mode, mapped from roguelike context) ---
    if (player.currentAction === 'CALL') {
      pDesperationDig = Math.max(pDesperationDig, 0.40);
      pGenuineStrong = Math.min(pGenuineStrong, 0.25);
    } else if (player.currentAction === 'FOLD') {
      pDesperationDig = 0.70;
      pGenuineStrong = 0.05;
      pCalculatedBluff = 0.10;
    }

    // --- Determine winning behavior label ---
    const probMap = {
      GENUINE_STRONG: pGenuineStrong,
      CALCULATED_BLUFF: pCalculatedBluff,
      TEMPO_MANIPULATION: pTempoManipulation,
      DESPERATION_DIG: pDesperationDig,
    };

    let winningBehavior: string = 'GENUINE_STRONG';
    let maxProb = 0;
    for (const [key, val] of Object.entries(probMap)) {
      if (val > maxProb) {
        maxProb = val;
        winningBehavior = key;
      }
    }

    // Aggression score
    const aggressionScore =
      player.currentAction === 'ALL_IN'
        ? 0.95
        : player.currentAction === 'RAISE'
        ? isFastAction
          ? 0.85
          : 0.70
        : player.currentAction === 'CALL'
        ? 0.40
        : 0.10;

    // Predictability
    const consistencyScore = Math.min(
      1.0,
      patterns.fastRaiseRate * 0.5 +
        (patterns.repeatedSequences.length > 0 ? 0.3 : 0) +
        (recentHands.length >= 3 ? 0.2 : 0.05)
    );

    // Reverse prediction tendency
    const reverseTendency =
      state.visiblePrediction && state.visiblePrediction.probability > 70
        ? 0.45
        : 0.15;

    // Bluff ratio from the 4-class model
    const bluffRatio = pCalculatedBluff / (pGenuineStrong + pCalculatedBluff + 0.01);

    // Confidence = the peak probability (now much sharper with 4 classes vs 7)
    const confidence = Math.max(...Object.values(probMap));

    return normalizeBelief({
      behavior: {
        value: winningBehavior as BehaviorType,
        probabilities: probMap,
        confidence,
      },
      bluff: bluffRatio,
      baiting: pTempoManipulation * 0.5,
      reversePrediction: reverseTendency,
      aggression: aggressionScore,
      predictability: consistencyScore,
      tilt: Math.min(1.0, pDesperationDig * 0.4),
    });
  }
}
