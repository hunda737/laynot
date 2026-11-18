/** Guess the Player: a photo that sharpens step by step, with one more text clue each step. */

export const PLAYER_STEPS = 6;
/** Coins to switch from typing a name to picking from four. */
export const CHOICES_COST = 25;

const BLUR = [40, 28, 18, 10, 4, 0];
const ZOOM = [2.4, 2, 1.6, 1.3, 1.1, 1];

/** Points for a solve at `step` (0-based): 60, 50, 40, 30, 20, 10. */
export function playerPoints(step: number): number {
  return Math.max(10, 60 - 10 * step);
}

export function blurForStep(step: number): number {
  return BLUR[Math.min(Math.max(step, 0), BLUR.length - 1)];
}

export function zoomForStep(step: number): number {
  return ZOOM[Math.min(Math.max(step, 0), ZOOM.length - 1)];
}

/** Lower-case, without accents or spaces, so "Mbappé" matches "mbappe". */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s.'’`\-_,]/g, '');
}

/** Names that contain the query, matching either language. */
export function searchNames<T extends { en: string; am: string }>(names: readonly T[], query: string): T[] {
  const q = normalizeName(query);
  if (!q) return [];
  return names.filter((n) => normalizeName(n.en).includes(q) || normalizeName(n.am).includes(q));
}

/** ⬛ for each step used before the solve, then ⚽ (or ❌ when not solved). */
export function playerGrid(stepsUsed: number, solved: boolean): string {
  return '⬛'.repeat(Math.max(0, stepsUsed - (solved ? 1 : 0))) + (solved ? '⚽' : '❌');
}
