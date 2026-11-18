import { familyOf } from './fidel';

export type WordleLang = 'en' | 'am';

/**
 * Feedback for one tile:
 * - `hit`: right character, right place
 * - `present`: the character is in the word, in another place
 * - `half` (Amharic only): right consonant family in this place, wrong vowel
 * - `miss`: none of the above
 */
export type TileState = 'hit' | 'present' | 'half' | 'miss';

export const WORD_LENGTH: Record<WordleLang, number> = { en: 5, am: 4 };
export const MAX_GUESSES = 6;
/** Coins to reveal one tile of the answer. */
export const WORDLE_HINT_COST = 30;

/** Split a word into tiles: letters in English, fidel characters in Amharic. */
export function tiles(word: string, lang: WordleLang): string[] {
  const chars = Array.from(word);
  return lang === 'en' ? chars.map((c) => c.toUpperCase()) : chars;
}

/**
 * Score a guess against the answer. A repeated character is only marked as often as it
 * appears in the answer, with exact hits counted first.
 */
export function scoreGuess(guess: string[], answer: string[], lang: WordleLang): TileState[] {
  const out: TileState[] = guess.map(() => 'miss');
  const left = new Map<string, number>();
  guess.forEach((g, i) => {
    if (g === answer[i]) out[i] = 'hit';
    else left.set(answer[i], (left.get(answer[i]) ?? 0) + 1);
  });
  guess.forEach((g, i) => {
    if (out[i] === 'hit') return;
    const n = left.get(g) ?? 0;
    if (n > 0) {
      out[i] = 'present';
      left.set(g, n - 1);
    } else if (lang === 'am' && answer[i] !== undefined && familyOf(g) === familyOf(answer[i])) {
      out[i] = 'half';
    }
  });
  return out;
}

const RANK: Record<TileState, number> = { miss: 0, half: 1, present: 2, hit: 3 };

/** The best state each character has shown so far, for colouring the keyboard. */
export function keyStates(guesses: string[][], marks: TileState[][]): Record<string, TileState> {
  const out: Record<string, TileState> = {};
  guesses.forEach((g, row) =>
    g.forEach((c, i) => {
      const s = marks[row][i];
      if (!out[c] || RANK[s] > RANK[out[c]]) out[c] = s;
    }),
  );
  return out;
}

/** 120 for a first-try solve, 20 less for each extra guess. Extra guesses from an ad score as the sixth. */
export function wordlePoints(guessesUsed: number): number {
  return Math.max(20, 120 - 20 * (Math.min(guessesUsed, MAX_GUESSES) - 1));
}

const EMOJI: Record<TileState, string> = { hit: '🟩', present: '🟨', half: '🟧', miss: '⬜' };

export function wordleGrid(marks: TileState[][]): string {
  return marks.map((row) => row.map((s) => EMOJI[s]).join('')).join('\n');
}
