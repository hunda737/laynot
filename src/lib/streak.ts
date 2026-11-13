import { daysBetween, type DayKey } from './clock';

export interface Streak {
  current: number;
  best: number;
  lastDay: DayKey | null;
}

export const EMPTY_STREAK: Streak = { current: 0, best: 0, lastDay: null };

/** Update the streak after the player finishes the Daily Challenge on `day`. */
export function applyDailyPlay(streak: Streak, day: DayKey): Streak {
  if (streak.lastDay === day) return streak;
  const continues = streak.lastDay !== null && daysBetween(streak.lastDay, day) === 1;
  const current = continues ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastDay: day };
}

/** The streak as it stands today: it survives until the end of the day after the last play. */
export function effectiveStreak(streak: Streak, today: DayKey): number {
  if (streak.lastDay === null) return 0;
  const gap = daysBetween(streak.lastDay, today);
  return gap <= 1 ? streak.current : 0;
}

/** True when the player has a streak that ends unless they play today. */
export function streakAtRisk(streak: Streak, today: DayKey): boolean {
  return streak.lastDay !== null && streak.current > 0 && daysBetween(streak.lastDay, today) === 1;
}
