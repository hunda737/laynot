/** Group the Four: sort 16 tiles into 4 hidden groups of 4. */

export const MAX_MISTAKES = 4;
export const GROUP_HINT_COST = 40;

/** Difficulty 0 (easiest, yellow) to 3 (hardest, purple). */
export type GroupLevel = 0 | 1 | 2 | 3;

export interface GroupDef<T> {
  theme: T;
  level: GroupLevel;
  tiles: [T, T, T, T];
}

export interface GroupPuzzle<T> {
  id: string;
  groups: [GroupDef<T>, GroupDef<T>, GroupDef<T>, GroupDef<T>];
}

/** A tile id is "<group index>-<tile index>", so the answer travels with the tile. */
export const tileId = (group: number, tile: number) => `${group}-${tile}`;
export const groupOf = (id: string) => Number(id.split('-')[0]);

export type GroupCheck = { kind: 'correct'; group: number } | { kind: 'oneAway' } | { kind: 'wrong' };

/** Check four selected tiles. "One away" means three of them belong together. */
export function checkGroup(selection: string[]): GroupCheck {
  const counts = new Map<number, number>();
  for (const id of selection) counts.set(groupOf(id), (counts.get(groupOf(id)) ?? 0) + 1);
  const best = Math.max(...counts.values());
  if (best === 4) return { kind: 'correct', group: groupOf(selection[0]) };
  return best === 3 ? { kind: 'oneAway' } : { kind: 'wrong' };
}

/** 100 minus 20 for each mistake. A failed puzzle scores nothing. */
export function groupsPoints(mistakes: number, solved: boolean): number {
  return solved ? Math.max(0, 100 - 20 * mistakes) : 0;
}

const LEVEL_EMOJI = ['🟨', '🟩', '🟦', '🟪'];

/** One row per submitted guess, each tile coloured by the group it really belongs to. */
export function groupsGrid(guesses: string[][], levelOf: (group: number) => GroupLevel): string {
  return guesses.map((g) => g.map((id) => LEVEL_EMOJI[levelOf(groupOf(id))]).join('')).join('\n');
}
