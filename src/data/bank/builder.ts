import type { Localized } from '@/i18n';

export type CategoryId =
  | 'ethiopia'
  | 'geography'
  | 'football'
  | 'science'
  | 'entertainment'
  | 'movies'
  | 'general'
  | 'books';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export interface Question {
  id: string;
  category: CategoryId;
  difficulty: Difficulty;
  text: Localized;
  /** The first choice is always the correct one. The play screen shuffles the order. */
  choices: [Localized, Localized, Localized, Localized];
  fact: Localized;
  /** True if the question suits the Daily Challenge: broad appeal, not niche. */
  daily?: boolean;
}

export type Pair = [en: string, am: string];

const L = ([en, am]: Pair): Localized => ({ en, am });
const LEVEL = { e: 'easy', m: 'medium', h: 'hard' } as const;

/**
 * Builds one question. Pass `true` as the last argument to put it in the Daily Challenge pool.
 *
 * Difficulty guide:
 * - e (easy): most adults in the region know it. The wrong choices are clearly different.
 * - m (medium): needs a specific fact such as a year, a name or a rule. The wrong choices are
 *   plausible and of the same kind (years close together, people from the same era).
 * - h (hard): needs real depth: exact numbers or dates, second-tier names, lesser-known works.
 *   Every wrong choice is believable, so the answer cannot be found by elimination alone.
 */
export function q(
  id: string,
  category: CategoryId,
  level: keyof typeof LEVEL,
  text: Pair,
  choices: [Pair, Pair, Pair, Pair],
  fact: Pair,
  daily?: boolean,
): Question {
  return {
    id,
    category,
    difficulty: LEVEL[level],
    text: L(text),
    choices: choices.map(L) as Question['choices'],
    fact: L(fact),
    ...(daily ? { daily: true } : {}),
  };
}
