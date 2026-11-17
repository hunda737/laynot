import type { DayKey } from './clock';
import { effectiveStreak, type Streak } from './streak';

/**
 * What the Mini App tells the Telegram bot's server: enough for reminders ("you haven't
 * played today", "your streak ends tonight") and for a real weekly board. The server checks
 * the format again; this is the sending side.
 */
export interface ProgressSnapshot {
  /** Minutes east of UTC on the phone, so reminders arrive at the player's own hour. */
  tz: number;
  lastDay: DayKey | null;
  /** The streak as it stands today (0 if it has already lapsed). */
  streak: number;
  best: number;
  /** Today's Daily Challenge result, once finished. */
  today: { day: DayKey; score: number; correct: number } | null;
  name: string;
}

interface Source {
  streak: Streak;
  dailyHistory: Record<DayKey, { score: number; correct: number }>;
  profile: { name: string } | null;
}

export function progressSnapshot(state: Source, today: DayKey, tzOffsetMin: number, fallbackName = ''): ProgressSnapshot {
  const record = state.dailyHistory[today];
  return {
    tz: tzOffsetMin,
    lastDay: state.streak.lastDay,
    streak: effectiveStreak(state.streak, today),
    best: state.streak.best,
    today: record ? { day: today, score: record.score, correct: record.correct } : null,
    name: (state.profile?.name ?? fallbackName).trim().slice(0, 24),
  };
}
