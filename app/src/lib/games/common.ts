import { addDays, daysBetween, LAUNCH_DAY, type DayKey } from '../clock';
import { seeded, shuffle } from '../rng';

/** One entry per daily puzzle. Wordle has one daily word per language. */
export type GameId = 'blitz' | 'wordle-en' | 'wordle-am' | 'groups' | 'player';
export const GAME_IDS: GameId[] = ['blitz', 'wordle-en', 'wordle-am', 'groups', 'player'];

/** A finished daily puzzle. `grid` is the emoji summary used on the share card. */
export interface GameRecord {
  points: number;
  solved: boolean;
  grid: string;
  coins: number;
  streakAfter: number;
}

export type DayGames = Partial<Record<GameId, GameRecord>>;

/** Games points that count toward one day's leaderboard score, so the main quiz stays the core. */
export const GAMES_DAILY_CAP = 400;
/** Coins for solving a daily puzzle. */
export const DAILY_SOLVE_COINS = 15;
/** Coins for winning a practice puzzle, on top of getting the staked life back. */
export const PRACTICE_REWARD = 10;
/** Game results older than this are dropped, to keep the saved state small. */
export const KEEP_DAYS = 15;

/** Total games points for one day, after the cap. */
export function gamesDayPoints(day: DayGames | undefined): number {
  if (!day) return 0;
  const sum = Object.values(day).reduce((total, r) => total + (r?.points ?? 0), 0);
  return Math.min(sum, GAMES_DAILY_CAP);
}

/**
 * Each day's leaderboard score: the Daily Challenge plus the capped games points.
 * A day with only games played still counts.
 */
export function dayScores(
  daily: Record<DayKey, { score: number }>,
  games: Record<DayKey, DayGames>,
): Record<DayKey, number> {
  const out: Record<DayKey, number> = {};
  for (const [day, r] of Object.entries(daily)) out[day] = r.score;
  for (const [day, g] of Object.entries(games)) {
    if (g && Object.keys(g).length > 0) out[day] = (out[day] ?? 0) + gamesDayPoints(g);
  }
  return out;
}

/** Drop results older than `KEEP_DAYS`. */
export function pruneGames(games: Record<DayKey, DayGames>, today: DayKey): Record<DayKey, DayGames> {
  const oldest = addDays(today, -(KEEP_DAYS - 1));
  return Object.fromEntries(Object.entries(games).filter(([day]) => day >= oldest));
}

/**
 * The item for `day` from a list: a fixed shuffle walked one step per day, so every
 * item is used once before any repeats, and every phone gets the same one.
 */
export function dailyItem<T>(items: readonly T[], game: string, day: DayKey): T {
  const order = shuffle(items, seeded(`${game}:order`));
  const n = daysBetween(LAUNCH_DAY, day);
  return order[((n % order.length) + order.length) % order.length];
}

/** A random item for practice, avoiding `avoid` when there is a choice. */
export function practiceItem<T>(items: readonly T[], rand: () => number, avoid?: T): T {
  const pool = items.length > 1 && avoid !== undefined ? items.filter((i) => i !== avoid) : items;
  return pool[Math.floor(rand() * pool.length)];
}
