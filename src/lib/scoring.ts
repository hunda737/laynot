export const QUESTION_TIME_MS = 15_000;
export const POINTS_CORRECT = 100;
export const MAX_SPEED_BONUS = 50;

export type AnswerMark = 'correct' | 'wrong' | 'timeout';

/**
 * 100 points for a correct answer plus a speed bonus that is capped at 50,
 * so accuracy always outweighs speed.
 */
export function scoreAnswer(correct: boolean, elapsedMs: number, limitMs = QUESTION_TIME_MS): number {
  if (!correct) return 0;
  const remaining = Math.min(Math.max(limitMs - elapsedMs, 0), limitMs);
  return POINTS_CORRECT + Math.round((MAX_SPEED_BONUS * remaining) / limitMs);
}

export function countCorrect(marks: readonly AnswerMark[]): number {
  return marks.filter((m) => m === 'correct').length;
}

const EMOJI: Record<AnswerMark, string> = { correct: '🟩', wrong: '🟥', timeout: '⬜' };

/** Spoiler-free result grid for the share card, five per row. */
export function shareGrid(marks: readonly AnswerMark[]): string {
  const cells = marks.map((m) => EMOJI[m]);
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 5) rows.push(cells.slice(i, i + 5).join(''));
  return rows.join('\n');
}

/**
 * Coins for a finished Daily Challenge: the coins for each correct answer
 * (8, 10 or 15 by level, see `correctCoins`) plus 5 per streak day, capped at 50.
 */
export function dailyCoins(answerCoins: number, streak: number): number {
  return answerCoins + Math.min(streak * 5, 50);
}
