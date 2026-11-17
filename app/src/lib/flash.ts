import { FLASH_CARDS, type FlashCard } from '@/data/flashcards';
import { pickByDifficulty, type LevelChoice } from './difficulty';

export const FLASH_ROUND_SIZE = 10;
/** Flat reward for finishing a round. Self-marked answers can't be checked, so cards themselves pay nothing. */
export const FLASH_ROUND_COINS = 5;

export function flashDeck(level: LevelChoice, rand: () => number = Math.random): FlashCard[] {
  return pickByDifficulty(FLASH_CARDS, level, FLASH_ROUND_SIZE, rand);
}

/** A round in progress. The card on show is always `queue[0]`. */
export interface FlashRun {
  queue: string[];
  /** Cards marked "Got it", in the order they were cleared. */
  cleared: string[];
  /** How each card went the first time it was shown. */
  firstTry: Record<string, 'known' | 'missed'>;
}

export function startRun(cards: readonly FlashCard[]): FlashRun {
  return { queue: cards.map((c) => c.id), cleared: [], firstTry: {} };
}

/**
 * Mark the card on show. "Got it" clears it; "Missed it" sends it to the back
 * of the queue, so it comes back before the round ends.
 */
export function markCard(run: FlashRun, known: boolean): FlashRun {
  const [current, ...rest] = run.queue;
  if (current === undefined) return run;
  const firstTry: FlashRun['firstTry'] =
    current in run.firstTry ? run.firstTry : { ...run.firstTry, [current]: known ? 'known' : 'missed' };
  return known
    ? { queue: rest, cleared: [...run.cleared, current], firstTry }
    : { queue: [...rest, current], cleared: run.cleared, firstTry };
}

export function runFinished(run: FlashRun): boolean {
  return run.queue.length === 0;
}

export function knownFirstTry(run: FlashRun): number {
  return Object.values(run.firstTry).filter((v) => v === 'known').length;
}

/** Cards that came back at least once because they were missed. */
export function missedCards(run: FlashRun): string[] {
  return Object.keys(run.firstTry).filter((id) => run.firstTry[id] === 'missed');
}
