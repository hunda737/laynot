/** Rewarded ads a player can watch per day (plan: start at about 5). */
export const AD_DAILY_CAP = 5;

export const HINT_COST = { fifty: 30, skip: 50 } as const;
export type HintKind = keyof typeof HINT_COST;

export const TOPIC_ROUND_SIZE = 5;
export const TOPIC_COINS_PER_CORRECT = 10;

/** Most recent missed questions kept for review. */
export const MISSED_CAP = 30;

export const STARTING_COINS = 50;

/** Pick two wrong choices (indexes 1..3) to hide for a 50/50 hint. */
export function fiftyFifty(rand: () => number = Math.random): number[] {
  const wrong = [1, 2, 3];
  const keep = wrong[Math.floor(rand() * wrong.length)];
  return wrong.filter((i) => i !== keep);
}

/** Newest first, no duplicates, capped. */
export function mergeMissed(current: readonly string[], added: readonly string[], cap = MISSED_CAP): string[] {
  const out = [...added.filter((id, i) => added.indexOf(id) === i)];
  for (const id of current) if (!out.includes(id)) out.push(id);
  return out.slice(0, cap);
}
