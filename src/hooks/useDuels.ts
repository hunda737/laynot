import { useMemo } from 'react';

import { translate, type Language, type StringKey } from '@/i18n';
import { dayKey } from '@/lib/clock';
import { botById, duelStatus, incomingNow, theirAnswers, type Duel, type DuelAnswer, type DuelStatus } from '@/lib/duel';
import { useGame } from '@/store/useGameStore';
import { useNow } from './useNow';

export interface DuelView {
  duel: Duel;
  status: DuelStatus;
  theirs?: DuelAnswer[];
  /** False for an incoming demo challenge that hasn't been played (and so saved) yet. */
  stored: boolean;
}

export const topicKey = (c: Duel['category']): StringKey => (c === 'mixed' ? 'level.mixed' : (`cat.${c}` as StringKey));

export function opponentName(duel: Duel, lang: Language): string {
  if (duel.opponent.kind === 'bot') return botById(duel.opponent.botId)?.name ?? '?';
  if (duel.opponent.kind === 'code') return duel.opponent.name;
  return translate(lang, 'duel.anyone');
}

/** Every duel on this phone plus today's incoming demo challenges, newest first. */
export function useDuels(tickMs = 5000) {
  const now = useNow(tickMs);
  const duels = useGame((s) => s.duels);
  const fast = useGame((s) => s.fastFriends);
  const today = dayKey(now);
  // Recompute incoming challenges once a minute, not on every tick.
  const minute = Math.floor(now / 60_000);

  const views = useMemo(() => {
    const ids = new Set(duels.map((d) => d.id));
    const incoming = incomingNow(today, minute * 60_000 + 59_999).filter((d) => !ids.has(d.id));
    const all: DuelView[] = [
      ...incoming.map((duel) => ({ duel, status: 'yourTurn' as const, theirs: duel.theirs, stored: false })),
      ...duels.map((duel) => ({ duel, status: duelStatus(duel, now, fast), theirs: theirAnswers(duel, now, fast), stored: true })),
    ];
    return all.filter((v) => v.status !== 'expired').sort((a, b) => (b.duel.mineAt ?? b.duel.createdAt) - (a.duel.mineAt ?? a.duel.createdAt));
  }, [duels, today, minute, now, fast]);

  const yourTurn = views.filter((v) => v.status === 'yourTurn').length;
  return { views, now, fast, yourTurn };
}
