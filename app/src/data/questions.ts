import { BOOKS } from './bank/books';
import { ENTERTAINMENT } from './bank/entertainment';
import { ETHIOPIA } from './bank/ethiopia';
import { FOOTBALL } from './bank/football';
import { GENERAL } from './bank/general';
import { GEOGRAPHY } from './bank/geography';
import { MOVIES } from './bank/movies';
import { SCIENCE } from './bank/science';
import type { CategoryId, Question } from './bank/builder';

export { DIFFICULTIES } from './bank/builder';
export type { CategoryId, Difficulty, Question } from './bank/builder';

// Facts are written from general knowledge for the demo. Check them before showing to a client.
// Levels are a first guess; the real app should re-tag them from players' answer rates.
// Each category has 100 questions. One file per category lives in ./bank.
export const QUESTIONS: Question[] = [
  ...ETHIOPIA,
  ...GEOGRAPHY,
  ...FOOTBALL,
  ...SCIENCE,
  ...ENTERTAINMENT, // Music (id kept as 'entertainment' so saved progress still matches)
  ...MOVIES,
  ...GENERAL,
  ...BOOKS,
];

/** The Daily Challenge pool: questions with broad appeal. */
export const DAILY_POOL: Question[] = QUESTIONS.filter((x) => x.daily);

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((x) => [x.id, x]));

// Append new categories at the end. Duel share codes store a category as its index in this list.
export const CATEGORIES: { id: CategoryId; icon: string }[] = [
  { id: 'ethiopia', icon: 'flag' },
  { id: 'geography', icon: 'earth' },
  { id: 'football', icon: 'football' },
  { id: 'science', icon: 'flask' },
  { id: 'movies', icon: 'film' },
  { id: 'entertainment', icon: 'musical-notes' },
  { id: 'general', icon: 'bulb' },
  { id: 'books', icon: 'book' },
];
