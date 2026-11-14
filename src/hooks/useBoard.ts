import { useMemo } from 'react';

import { useT } from '@/i18n';
import { dayKey } from '@/lib/clock';
import { buildBoard, type Period, type Scope, type YouInput } from '@/lib/leaderboard';
import { useGame } from '@/store/useGameStore';
import { useNow } from './useNow';

/** The player as the leaderboard sees them. */
export function useYouInput(): YouInput {
  const { t } = useT();
  const profile = useGame((s) => s.profile);
  const history = useGame((s) => s.dailyHistory);
  return useMemo(
    () => ({
      name: profile?.name ?? t('ranks.you'),
      city: '',
      scores: Object.fromEntries(Object.values(history).map((r) => [r.day, r.score])),
    }),
    [profile, history, t],
  );
}

export function useBoard(scope: Scope, period: Period) {
  const now = useNow(60_000);
  const today = dayKey(now);
  const hour = new Date(now).getHours();
  const you = useYouInput();
  const board = useMemo(() => buildBoard({ scope, period, today, hour, you }), [scope, period, today, hour, you]);
  return { board, today, now, you };
}
