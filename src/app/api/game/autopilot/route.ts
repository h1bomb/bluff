import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { auth } from '@/auth';
import { sessionKeyFor } from '@/game/engine/session-key';
import { sanitizePublicState } from '@/game/engine/game-engine';
import { evaluateAutopilotDecisions } from '@/game/autopilot/evaluator';
import { resolveQuotaIdentity } from '@/jev/identity';
import { consumeMinuteQuota } from '@/jev/rate-limiter';
import { consumeDailyQuota, peekDailyQuota } from '@/jev/daily-quota';
import { hasJevApiKey } from '@/jev/provider-selector';
import { resolveSession } from '../action/session-resolver';

const AutopilotSchema = z.object({
  gameId: z.string().min(1),
  sequence: z.number().int().nonnegative().optional(),
  clientState: z.any().optional(),
});

const JEV_PICK_TIMEOUT_MS = 2500;

/**
 * Server-side Jev "brain" for the autopilot: rebuilds the candidate lines with
 * the same deterministic evaluators the client uses, then lets Jev pick one.
 * Quota is consumed only when Jev is actually asked; on exhaustion, timeout,
 * or any failure the route returns the top heuristic candidate instead.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const identity = resolveQuotaIdentity(userId, req.headers);

    const body = await req.json();
    const parsed = AutopilotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { gameId, clientState } = parsed.data;
    const sessionKey = sessionKeyFor(userId, gameId);
    const game = resolveSession(sessionKey, clientState);
    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game session not found or expired' },
        { status: 404 }
      );
    }

    const publicState = sanitizePublicState(game);
    const candidates = evaluateAutopilotDecisions(publicState, game.shopInventory ?? publicState.shopInventory);
    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No candidate decisions available' },
        { status: 400 }
      );
    }

    const quotaOf = async () => {
      const snap = await peekDailyQuota(identity.key, identity.dailyLimit);
      return { ...snap, isGuest: identity.isGuest };
    };

    // No Jev client at all → never touch the quota counters.
    if (!hasJevApiKey()) {
      return NextResponse.json({
        success: true,
        decision: candidates[0],
        fallback: 'heuristic',
        fallbackReason: 'no_api_key',
        jevQuota: await quotaOf(),
      });
    }

    // Quota gate: burst window first, then the durable daily counter (plus
    // the per-IP backstop for guests), mirroring QuotaAwareJevProvider.
    let allowed = consumeMinuteQuota(identity.key, identity.minuteLimit).allowed;
    if (allowed) {
      allowed = (await consumeDailyQuota(identity.key, identity.dailyLimit)).allowed;
    }
    if (allowed && identity.ipKey) {
      if (consumeMinuteQuota(identity.ipKey, identity.ipMinuteLimit).allowed) {
        allowed = (await consumeDailyQuota(identity.ipKey, identity.ipDailyLimit)).allowed;
      } else {
        allowed = false;
      }
    }

    if (!allowed) {
      return NextResponse.json({
        success: true,
        decision: candidates[0],
        fallback: 'heuristic',
        jevThrottled: true,
        jevQuota: await quotaOf(),
      });
    }

    try {
      const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY as string });
      const labels: Record<string, string> = {};
      candidates.forEach((c, i) => {
        labels[`D${i}`] = `${c.type}/${c.category}: ${c.title} — ${c.reasoning}`;
      });

      const state = {
        phase: publicState.phase,
        ante: publicState.ante,
        blindType: publicState.blind?.blindType,
        targetScore: publicState.targetScore,
        currentRoundScore: publicState.currentRoundScore,
        handsLeft: publicState.handsLeft,
        discardsLeft: publicState.discardsLeft,
        money: publicState.money,
        jokers: (publicState.jokers ?? []).map((j) => j.jokerKey),
        aiRead: publicState.belief
          ? `${publicState.belief.behavior.value}@${Math.round(publicState.belief.behavior.confidence * 100)}%`
          : null,
        aiBluffSuspicion: publicState.belief?.bluff ?? null,
      };

      const apiPromise = client.systemOne({
        state: state as unknown as Parameters<TypeSafeClient['systemOne']>[0]['state'],
        questions: {
          pick: {
            type: 'choice' as const,
            instructions:
              'You are the autopilot piloting a Balatro-like roguelike poker run with cognitive-warfare scoring ' +
              '(playing a weak hand while the AI confidently reads you as strong triggers a huge Model Break multiplier; ' +
              'scores accumulate toward the blind target within limited hands; unspent money earns interest capped at $25). ' +
              'Pick the strategically optimal line for long-term run survival: clear the blind efficiently when possible; ' +
              'dig for draws when behind with resources left; buy multiplier/synergy jokers early; preserve economy otherwise.',
            criteria: labels,
          },
        },
      });
      const response = await Promise.race([
        apiPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Jev autopilot pick timeout')), JEV_PICK_TIMEOUT_MS)
        ),
      ]);

      const picked = String(response.answers.pick.choice);
      const idx = /^D(\d+)$/.exec(picked)?.[1];
      const decision = candidates[Number(idx)] ?? candidates[0];

      return NextResponse.json({
        success: true,
        decision,
        jevPicked: true,
        jevConfidence: response.answers.pick.confidence,
        jevQuota: await quotaOf(),
      });
    } catch (err) {
      console.warn('Jev autopilot pick failed, falling back to heuristic top candidate:', err);
      return NextResponse.json({
        success: true,
        decision: candidates[0],
        fallback: 'heuristic',
        fallbackReason: 'error',
        jevQuota: await quotaOf(),
      });
    }
  } catch (err: unknown) {
    console.error('Error in /api/game/autopilot:', err);
    const message = err instanceof Error ? err.message : 'Internal autopilot pick error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
