import { QUESTIONS, type Question } from './questions';
import { SPONSORED_QUESTIONS } from './sponsors';
import { STREET_QUESTIONS } from './street';

const ALL: Question[] = [...QUESTIONS, ...SPONSORED_QUESTIONS, ...STREET_QUESTIONS];
const BY_ID: Record<string, Question> = Object.fromEntries(ALL.map((q) => [q.id, q]));

/** Look up any question (topic, sponsored or street) by id, for reviews and history. */
export function questionById(id: string): Question | undefined {
  return BY_ID[id];
}
