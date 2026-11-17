export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;

/** A calendar day in the phone's local time zone, written as YYYY-MM-DD. */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(ts: number): DayKey {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of the given day. */
export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, days: number): DayKey {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d.getTime());
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((parseDayKey(to).getTime() - parseDayKey(from).getTime()) / DAY_MS);
}

/** The Monday-to-Sunday week that contains `key`. */
export function weekDays(key: DayKey): DayKey[] {
  const d = parseDayKey(key);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(key, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekStart(key: DayKey): DayKey {
  return weekDays(key)[0];
}

export function msUntilNextDay(ts: number): number {
  const d = new Date(ts);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return next.getTime() - ts;
}

/** 7_380_000 -> "2:03:00"; under an hour -> "12:05". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Milliseconds until the current Monday-to-Sunday week ends. */
export function msUntilWeekEnd(ts: number): number {
  const end = parseDayKey(addDays(weekStart(dayKey(ts)), 7)).getTime();
  return end - ts;
}

/** The first Daily Challenge. Used to number the share card ("Laynot #14"). */
export const LAUNCH_DAY: DayKey = '2026-11-01';

export function dailyNumber(key: DayKey): number {
  return daysBetween(LAUNCH_DAY, key) + 1;
}
