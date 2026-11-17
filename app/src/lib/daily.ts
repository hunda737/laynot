import { DAILY_POOL, type Question } from '@/data/questions';
import type { DayKey } from './clock';
import { DAILY_RAMP, rampedPick } from './difficulty';
import { seeded, shuffle } from './rng';

export const DAILY_COUNT = 10;

export interface PlayableQuestion {
  question: Question;
  /** Display order as indexes into `question.choices`. Index 0 is the correct choice. */
  order: number[];
}

/**
 * Same 10 questions and the same answer order for every player on a given day.
 * The set ramps up: 3 easy, 4 medium, 3 hard. It draws only from the general-purpose pool,
 * so a niche question (say, one about a single football club) never appears here.
 */
export function dailyQuestions(day: DayKey): PlayableQuestion[] {
  const rand = seeded(`daily:${day}`);
  return rampedPick(DAILY_POOL, DAILY_RAMP, rand).map((question) => ({
    question,
    order: shuffle([0, 1, 2, 3], rand),
  }));
}

/** Ids of the day's Daily Challenge questions, kept out of duels and rooms so they can't leak answers. */
export function dailyIds(day: DayKey): Set<string> {
  return new Set(dailyQuestions(day).map((pq) => pq.question.id));
}
