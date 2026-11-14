import { BOTS, type Bot } from '@/data/players';
import { addDays, daysBetween, weekDays, type DayKey } from './clock';
import { DAILY_COUNT } from './daily';
import { MAX_SPEED_BONUS, POINTS_CORRECT } from './scoring';
import { seeded } from './rng';

export type Scope = 'global' | 'friends' | 'league';
export type Period = 'week' | 'today';

/** Weekly score is the sum of the best 5 of 7 daily scores, so one missed day does not ruin a week. */
export const BEST_OF_DAYS = 5;
export const MIN_DAYS_FOR_PRIZE = 3;
export const YOU_ID = 'you';

export interface BoardEntry {
  id: string;
  name: string;
  city: string;
  score: number;
  daysPlayed: number;
  rank: number;
  isYou: boolean;
}

export interface YouInput {
  name: string;
  city: string;
  /** Daily Challenge scores by day. */
  scores: Record<DayKey, number>;
}

/**
 * A bot's Daily Challenge score for a day, or null if it did not play.
 * On the current day a bot only counts once its usual play hour has passed.
 */
export function botDayScore(bot: Bot, day: DayKey, today: DayKey, hour: number): number | null {
  if (day > today) return null;
  const rand = seeded(`${bot.id}:${day}`);
  if (rand() > bot.activity) return null;
  // Most play during the day, a few are night owls, so early-morning boards are not empty.
  const playHour = Math.floor(rand() * 22);
  if (day === today && hour < playHour) return null;
  let score = 0;
  for (let i = 0; i < DAILY_COUNT; i++) {
    if (rand() < bot.skill) score += POINTS_CORRECT + Math.round(rand() * MAX_SPEED_BONUS * 0.8);
  }
  return score;
}

export function bestOf(scores: number[], n = BEST_OF_DAYS): number {
  return [...scores].sort((a, b) => b - a).slice(0, n).reduce((sum, s) => sum + s, 0);
}

function periodDays(period: Period, today: DayKey): DayKey[] {
  return period === 'today' ? [today] : weekDays(today).filter((d) => d <= today);
}

function total(period: Period, scores: number[]): number {
  return period === 'today' ? (scores[0] ?? 0) : bestOf(scores);
}

/** Activity tier 0-3, used to group players into leagues of similar engagement. */
export function activityTier(activity: number): number {
  if (activity >= 0.9) return 3;
  if (activity >= 0.75) return 2;
  if (activity >= 0.5) return 1;
  return 0;
}

/** Share of the last 14 days on which the player finished the Daily Challenge. */
export function youActivity(scores: Record<DayKey, number>, today: DayKey): number {
  const days = Object.keys(scores)
    .filter((d) => d <= today)
    .sort();
  if (days.length < 3) return 0.6; // new players start in a middle league
  const span = Math.min(14, daysBetween(days[0], today) + 1);
  const recent = days.filter((d) => daysBetween(d, today) < 14).length;
  return Math.min(1, recent / span);
}

export function buildBoard(opts: {
  scope: Scope;
  period: Period;
  today: DayKey;
  hour: number;
  you: YouInput;
}): BoardEntry[] {
  const { scope, period, today, hour, you } = opts;
  const days = periodDays(period, today);

  let bots = BOTS;
  if (scope === 'friends') bots = BOTS.filter((b) => b.friend);
  if (scope === 'league') {
    const tier = activityTier(youActivity(you.scores, today));
    bots = BOTS.filter((b) => activityTier(b.activity) === tier).slice(0, 14);
  }

  const rows: Omit<BoardEntry, 'rank'>[] = [];
  for (const bot of bots) {
    const scores = days.map((d) => botDayScore(bot, d, today, hour)).filter((s): s is number => s !== null);
    if (scores.length === 0) continue;
    rows.push({ id: bot.id, name: bot.name, city: bot.city, score: total(period, scores), daysPlayed: scores.length, isYou: false });
  }
  const yourScores = days.map((d) => you.scores[d]).filter((s): s is number => s !== undefined);
  if (yourScores.length > 0) {
    rows.push({
      id: YOU_ID,
      name: you.name,
      city: you.city,
      score: total(period, yourScores),
      daysPlayed: yourScores.length,
      isYou: true,
    });
  }

  rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.score !== rows[i - 1].score) rank = i + 1;
    return { ...r, rank };
  });
}

/** Last full week's global top 3, as it stood at the end of Sunday. */
export function lastWeekWinners(today: DayKey, you: YouInput): BoardEntry[] {
  const lastSunday = addDays(weekDays(today)[0], -1);
  return buildBoard({ scope: 'global', period: 'week', today: lastSunday, hour: 24, you }).slice(0, 3);
}

export interface Eligibility {
  signedUp: boolean;
  adult: boolean;
  enoughDays: boolean;
  daysPlayed: number;
  eligible: boolean;
}

export function prizeEligibility(
  profile: { adult: boolean } | null,
  scores: Record<DayKey, number>,
  today: DayKey,
): Eligibility {
  const daysPlayed = periodDays('week', today).filter((d) => scores[d] !== undefined).length;
  const signedUp = profile !== null;
  const adult = !!profile?.adult;
  const enoughDays = daysPlayed >= MIN_DAYS_FOR_PRIZE;
  return { signedUp, adult, enoughDays, daysPlayed, eligible: signedUp && adult && enoughDays };
}
