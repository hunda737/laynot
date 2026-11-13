import { QUESTIONS, type Question } from '@/data/questions';
import type { DayKey } from './clock';
import { pickN, seeded, shuffle } from './rng';

export const DAILY_COUNT = 10;

export interface PlayableQuestion {
  question: Question;
  /** Display order as indexes into `question.choices`. Index 0 is the correct choice. */
  order: number[];
}

/** Same 10 questions and the same answer order for every player on a given day. */
export function dailyQuestions(day: DayKey): PlayableQuestion[] {
  const rand = seeded(`daily:${day}`);
  return pickN(QUESTIONS, DAILY_COUNT, rand).map((question) => ({
    question,
    order: shuffle([0, 1, 2, 3], rand),
  }));
}
