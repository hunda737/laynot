import { useMemo } from 'react';

import { useT } from '@/i18n';
import { dayKey } from '@/lib/clock';
import type { Bot } from '@/data/players';
import { dayScores } from '@/lib/games/common';
import { buildBoard, type Period, type YouInput } from '@/lib/leaderboard';
import { useGame } from '@/store/useGameStore';
import { useNow } from './useNow';

/** The player as the leaderboard sees them: each day is the Daily Challenge plus the capped games points. */
export function useYouInput(): YouInput {
  const { t } = useT();
  const profile = useGame((s) => s.profile);
  const history = useGame((s) => s.dailyHistory);
  const games = useGame((s) => s.gameResults);
  return useMemo(
    () => ({
      name: profile?.name ?? t('ranks.you'),
      city: '',
      scores: dayScores(history, games),
    }),
    [profile, history, games, t],
  );
}

/** A live board for the given players. Pass a stable (memoized) member list. */
export function useBoard(members: readonly Bot[], period: Period) {
  const now = useNow(60_000);
  const today = dayKey(now);
  const hour = new Date(now).getHours();
  const you = useYouInput();
  const board = useMemo(() => buildBoard({ members, period, today, hour, you }), [members, period, today, hour, you]);
  return { board, today, now, you };
}
