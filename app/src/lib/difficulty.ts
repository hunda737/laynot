import { questionById } from '@/data';
import type { Difficulty } from '@/data/questions';
import { shuffle } from './rng';

/** What a player can choose: one level, or a mix of all three. */
export type LevelChoice = Difficulty | 'mixed';
export const LEVEL_CHOICES: LevelChoice[] = ['mixed', 'easy', 'medium', 'hard'];

/** Coins for one correct answer. Harder questions pay more. */
export const COINS_BY_LEVEL: Record<Difficulty, number> = { easy: 8, medium: 10, hard: 15 };

export function coinsFor(level: Difficulty): number {
  return COINS_BY_LEVEL[level];
}

/** Total coins for the correct answers in a list, by each question's level. */
export function correctCoins(answers: readonly { questionId: string; mark: string }[]): number {
  return answers
    .filter((a) => a.mark === 'correct')
    .reduce((sum, a) => sum + coinsFor(questionById(a.questionId)?.difficulty ?? 'medium'), 0);
}

/** Levels to draw from, nearest first, when the chosen one runs short. */
const FALLBACK: Record<Difficulty, Difficulty[]> = {
  easy: ['easy', 'medium', 'hard'],
  medium: ['medium', 'easy', 'hard'],
  hard: ['hard', 'medium', 'easy'],
};

/**
 * Pick `n` items at the chosen level. If that level has too few, the nearest
 * level fills in, so a round is never short.
 */
export function pickByDifficulty<T extends { difficulty: Difficulty }>(
  pool: readonly T[],
  level: LevelChoice,
  n: number,
  rand: () => number,
): T[] {
  if (level === 'mixed') return shuffle(pool, rand).slice(0, n);
  const out: T[] = [];
  for (const l of FALLBACK[level]) {
    if (out.length >= n) break;
    out.push(...shuffle(pool.filter((x) => x.difficulty === l), rand).slice(0, n - out.length));
  }
  return out;
}

/** The Daily Challenge and Live Room ramp: easy first, hard last. */
export const DAILY_RAMP: [Difficulty, number][] = [
  ['easy', 3],
  ['medium', 4],
  ['hard', 3],
];

/** Pick a run that goes from easy to hard, e.g. 3 easy, 4 medium, 3 hard. */
export function rampedPick<T extends { id: string; difficulty: Difficulty }>(
  pool: readonly T[],
  ramp: [Difficulty, number][],
  rand: () => number,
): T[] {
  const out: T[] = [];
  for (const [level, count] of ramp) {
    const left = pool.filter((x) => !out.some((o) => o.id === x.id));
    out.push(...pickByDifficulty(left, level, count, rand));
  }
  return out;
}

/** Scale a ramp to a different length, keeping the easy-to-hard shape. */
export function scaleRamp(total: number): [Difficulty, number][] {
  const easy = Math.round(total * 0.3);
  const hard = Math.round(total * 0.3);
  return [
    ['easy', easy],
    ['medium', total - easy - hard],
    ['hard', hard],
  ];
}
