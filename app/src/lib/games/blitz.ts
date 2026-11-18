/** True or False Blitz: a timed run of statements with a combo multiplier. */

export const BLITZ_MS = 45_000;
export const WRONG_PENALTY_MS = 3_000;
export const MAX_WRONG = 3;
export const POINTS_PER_RIGHT = 10;
/** Every this many right answers in a row raises the multiplier by one. */
export const COMBO_STEP = 5;
export const MAX_MULTIPLIER = 3;
/** Right answers needed to win a practice run (and to count the daily run as solved). */
export const BLITZ_TARGET = 10;
export const DAILY_RUN_SIZE = 20;
export const PRACTICE_RUN_SIZE = 40;
export const EXTRA_TIME_MS = 5_000;
export const EXTRA_TIME_COST = 20;
export const SKIP_COST = 15;

export interface BlitzState {
  score: number;
  combo: number;
  bestCombo: number;
  right: number;
  wrong: number;
  /** One mark per statement answered, for the share card. */
  marks: boolean[];
}

export const BLITZ_START: BlitzState = { score: 0, combo: 0, bestCombo: 0, right: 0, wrong: 0, marks: [] };

/** The multiplier for the next right answer, given the current run of right answers. */
export function multiplierFor(combo: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_STEP));
}

export function applyBlitzAnswer(state: BlitzState, right: boolean): BlitzState {
  if (!right) {
    return { ...state, combo: 0, wrong: state.wrong + 1, marks: [...state.marks, false] };
  }
  const combo = state.combo + 1;
  return {
    score: state.score + POINTS_PER_RIGHT * multiplierFor(state.combo),
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    right: state.right + 1,
    wrong: state.wrong,
    marks: [...state.marks, true],
  };
}

export function blitzGrid(marks: boolean[]): string {
  const cells = marks.map((m) => (m ? '🟩' : '🟥'));
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 10) rows.push(cells.slice(i, i + 10).join(''));
  return rows.join('\n');
}
