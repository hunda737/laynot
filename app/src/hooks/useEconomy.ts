import { dayKey } from '@/lib/clock';
import { AD_DAILY_CAP } from '@/lib/economy';
import { settleLives, type LivesView } from '@/lib/lives';
import { refillMsOf, useGame } from '@/store/useGameStore';
import { useNow } from './useNow';

/** Lives with refills applied, updated every second, plus the current time. */
export function useLives(): LivesView & { now: number } {
  const lives = useGame((s) => s.lives);
  const anchor = useGame((s) => s.livesAnchor);
  const fastRefill = useGame((s) => s.fastRefill);
  const now = useNow(1000);
  return { ...settleLives({ lives, anchor }, now, refillMsOf({ fastRefill })), now };
}

export function useAdsLeft(): number {
  const ads = useGame((s) => s.ads);
  const today = dayKey(useNow(15_000));
  return AD_DAILY_CAP - (ads.day === today ? ads.count : 0);
}
