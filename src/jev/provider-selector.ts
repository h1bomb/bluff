import { ObservablePlayerState, PlayerBelief } from '../game/types';
import { DecisionProvider } from './provider';
import { TypeSafeJevProvider } from './typesafe-provider';
import { HeuristicDecisionProvider } from './heuristic-provider';
import { consumeMinuteQuota } from './rate-limiter';
import { consumeDailyQuota, DailyQuotaSnapshot } from './daily-quota';
import { QuotaIdentity } from './identity';

const jevProvider = new TypeSafeJevProvider();
const heuristicProvider = new HeuristicDecisionProvider();

/** True when the Jev API key is configured; without it every call is heuristic. */
export function hasJevApiKey(): boolean {
  return !!process.env.TYPESAFE_API_KEY;
}

/**
 * Wraps the paid Jev engine with per-identity quota checks (per-minute burst
 * window + durable daily counter). Quota is consumed only when a Jev
 * evaluation would actually happen; when exhausted, the game falls back to
 * the heuristic engine and the route flags the response.
 */
class QuotaAwareJevProvider implements DecisionProvider {
  name = 'TypeSafeJevEngine';
  throttled = false;
  lastQuota: (DailyQuotaSnapshot & { isGuest: boolean }) | null = null;

  constructor(private readonly identity: QuotaIdentity) {}

  async evaluatePlayer(state: ObservablePlayerState): Promise<PlayerBelief> {
    // Never burn quota when there is no Jev backend to call.
    if (!hasJevApiKey()) {
      return heuristicProvider.evaluatePlayer(state);
    }

    const id = this.identity;

    // 1. Device/user burst window
    let allowed = consumeMinuteQuota(id.key, id.minuteLimit).allowed;

    // 2. Device/user durable daily counter
    if (allowed) {
      const daily = await consumeDailyQuota(id.key, id.dailyLimit);
      this.lastQuota = { used: daily.used, limit: daily.limit, remaining: daily.remaining, isGuest: id.isGuest };
      allowed = daily.allowed;
    }

    // 3. Guest aggregate per-IP backstop against cookie rotation
    if (allowed && id.ipKey) {
      if (!consumeMinuteQuota(id.ipKey, id.ipMinuteLimit).allowed) {
        allowed = false;
      } else {
        allowed = (await consumeDailyQuota(id.ipKey, id.ipDailyLimit)).allowed;
      }
    }

    if (!allowed) {
      this.throttled = true;
      console.warn(`Jev quota exceeded for ${id.key}, falling back to heuristic.`);
      return heuristicProvider.evaluatePlayer(state);
    }
    return jevProvider.evaluatePlayer(state);
  }
}

export interface ProviderSelection {
  provider: DecisionProvider;
  /** True once a Jev evaluation in this request fell back to heuristic due to quota. */
  wasThrottled: () => boolean;
  /** Latest daily quota snapshot for the caller, if a Jev evaluation happened. */
  quotaSnapshot: () => (DailyQuotaSnapshot & { isGuest: boolean }) | null;
}

export function selectDecisionProvider(identity: QuotaIdentity): ProviderSelection {
  const wrapped = new QuotaAwareJevProvider(identity);
  return {
    provider: wrapped,
    wasThrottled: () => wrapped.throttled,
    quotaSnapshot: () => wrapped.lastQuota,
  };
}
