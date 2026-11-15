import { daysBetween, weekDays, type DayKey } from './clock';

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

/**
 * How one day of the current week looks on the streak strip:
 * - `streak`: played, and part of the run that is still alive
 * - `played`: played, but that run has since been broken
 * - `today`: today, not played yet
 * - `missed`: a past day with no play
 * - `future`: not here yet
 */
export type StripState = 'streak' | 'played' | 'today' | 'missed' | 'future';

export interface StripDay {
  day: DayKey;
  state: StripState;
  isToday: boolean;
}

/** The Monday-to-Sunday week containing `today`, one entry per day, for the streak strip. */
export function weekStrip(history: Record<DayKey, unknown>, streak: Streak, today: DayKey): StripDay[] {
  const alive = effectiveStreak(streak, today);
  return weekDays(today).map((day) => {
    const isToday = day === today;
    const played = history[day] !== undefined;
    let state: StripState;
    if (day > today) state = 'future';
    else if (played) {
      // Days back from the last play; inside the live run when smaller than its length.
      const back = streak.lastDay === null ? -1 : daysBetween(day, streak.lastDay);
      state = alive > 0 && back >= 0 && back < streak.current ? 'streak' : 'played';
    } else state = isToday ? 'today' : 'missed';
    return { day, state, isToday };
  });
}
