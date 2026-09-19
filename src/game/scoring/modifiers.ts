import { Card } from '../types';
import { JokerInstance, JokerScoringContext } from '../jokers/types';
import { JOKER_DEFINITIONS } from '../jokers/definitions';
import { enJson, zhJson, format } from '@/lib/i18n/translations';
import { ScoreTallyBuilder } from './tally-builder';

export function applyCardModifiers(handCards: Card[], builder: ScoreTallyBuilder): void {
  let modChips = 0;
  let modMult = 0;
  let polyXMult = 1.0;
  const modMessages: string[] = [];
  const modMessagesZh: string[] = [];

  for (const c of handCards) {
    if (c.extraChips) {
      modChips += c.extraChips;
      modMessages.push(format(enJson.scoring.stepTemplates.extraChips, { suit: c.suit, rank: c.rank, chips: c.extraChips }));
      modMessagesZh.push(format(zhJson.scoring.stepTemplates.extraChips, { suit: c.suit, rank: c.rank, chips: c.extraChips }));
    }
    if (c.modifier === 'FOIL') {
      modChips += 50;
      modMessages.push(format(enJson.scoring.stepTemplates.foil, { suit: c.suit, rank: c.rank }));
      modMessagesZh.push(format(zhJson.scoring.stepTemplates.foil, { suit: c.suit, rank: c.rank }));
    } else if (c.modifier === 'HOLO') {
      modMult += 10;
      modMessages.push(format(enJson.scoring.stepTemplates.holo, { suit: c.suit, rank: c.rank }));
      modMessagesZh.push(format(zhJson.scoring.stepTemplates.holo, { suit: c.suit, rank: c.rank }));
    } else if (c.modifier === 'POLY') {
      polyXMult *= 1.5;
      modMessages.push(format(enJson.scoring.stepTemplates.poly, { suit: c.suit, rank: c.rank }));
      modMessagesZh.push(format(zhJson.scoring.stepTemplates.poly, { suit: c.suit, rank: c.rank }));
    }
  }

  if (modChips > 0 || modMult > 0 || polyXMult > 1.0) {
    builder.addStep({
      type: 'CARD_BONUS',
      source: 'CARD_MODS',
      chipsAdded: modChips > 0 ? modChips : undefined,
      multAdded: modMult > 0 ? modMult : undefined,
      xMult: polyXMult > 1.0 ? polyXMult : undefined,
      message: modMessages.join(' | '),
      messageZh: modMessagesZh.join(' | '),
    });
  }
}

export function applyJokerTriggers(
  jokers: JokerInstance[],
  scoringContext: JokerScoringContext,
  builder: ScoreTallyBuilder,
  isModelBreak: boolean
): void {
  for (const joker of jokers) {
    const def = JOKER_DEFINITIONS[joker.jokerKey];
    if (!def) continue;

    if (isModelBreak && def.onModelBreak) {
      const mbRes = def.onModelBreak(scoringContext, joker);
      if (mbRes.message) {
        builder.addStep({
          type: 'JOKER_TRIGGER',
          source: joker.name,
          cognitiveMult: mbRes.cognitiveMultMultiplier 
            ? builder.currentCognitiveMult * mbRes.cognitiveMultMultiplier 
            : undefined,
          message: mbRes.message,
          messageZh: mbRes.messageZh || mbRes.message,
        });
      } else if (mbRes.cognitiveMultMultiplier) {
        builder.currentCognitiveMult *= mbRes.cognitiveMultMultiplier;
      }
    }

    if (def.onPlayHand) {
      scoringContext.chips = builder.currentChips;
      scoringContext.mult = builder.currentMult;
      scoringContext.cognitiveMult = builder.currentCognitiveMult;

      const res = def.onPlayHand(scoringContext, joker);
      if (res.chipsAdded || res.multAdded || res.xMult || res.message) {
        builder.addStep({
          type: 'JOKER_TRIGGER',
          source: joker.name,
          chipsAdded: res.chipsAdded,
          multAdded: res.multAdded,
          xMult: res.xMult,
          cognitiveMult: res.cognitiveMultMultiplier 
            ? builder.currentCognitiveMult * res.cognitiveMultMultiplier 
            : undefined,
          message: res.message || format(enJson.scoring.stepTemplates.jokerTriggerDefault, {
            icon: joker.icon,
            name: joker.name,
          }),
          messageZh: res.messageZh || res.message || format(zhJson.scoring.stepTemplates.jokerTriggerDefault, {
            icon: joker.icon,
            name: joker.nameZh || joker.name,
          }),
        });
      } else if (res.cognitiveMultMultiplier) {
        builder.currentCognitiveMult *= res.cognitiveMultMultiplier;
      }
    }
  }
}
