import { daysBetween, weekStart, type DayKey } from '@/lib/clock';
import { SPONSORS, type Sponsor } from './sponsors';

/** Prize money in Birr for places 1 to 3. Demo amounts, funded by the week's sponsor. */
export const PRIZE_AMOUNTS = [3000, 1500, 750] as const;

/** Each week a different demo sponsor funds the prize. */
export function weeklySponsor(today: DayKey): Sponsor {
  const weekIndex = Math.floor(daysBetween('2026-01-05', weekStart(today)) / 7);
  return SPONSORS[((weekIndex % SPONSORS.length) + SPONSORS.length) % SPONSORS.length];
}
