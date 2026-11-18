/**
 * The Ethiopic syllabary (fidel) as the Amharic word game uses it.
 *
 * Each consonant family has seven vowel orders, stored next to each other in Unicode
 * (base + 0 … base + 6: ä, u, i, a, e, ə, o). Most families also have a "wa" form at
 * base + 7; the velars (ቀ ከ ገ ኀ) keep theirs in a separate block.
 */

/** First-order character of each family used in Amharic, in the usual fidel order. */
const BASES = [
  'ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ', 'ቨ', 'ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ',
  'ከ', 'ኸ', 'ወ', 'ዐ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ጸ', 'ፀ', 'ፈ', 'ፐ',
] as const;

/** Families whose base + 7 is a "wa" form (ሏ, ሟ, ቧ …). */
const WA_AT_7 = new Set(['ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'በ', 'ቨ', 'ተ', 'ቸ', 'ነ', 'ኘ', 'ዘ', 'ዠ', 'ደ', 'ጀ', 'ጠ', 'ጨ', 'ጰ', 'ጸ', 'ፈ', 'ፐ']);

/** The velar "wa" forms, which live outside their family's block. */
const VELAR_WA: Record<string, string> = { ቀ: 'ቋ', ከ: 'ኳ', ገ: 'ጓ', ኀ: 'ኋ' };

export interface FidelFamily {
  base: string;
  /** The seven vowel orders, then any extra forms. */
  forms: string[];
}

const at = (base: string, offset: number) => String.fromCodePoint(base.codePointAt(0)! + offset);

export const FIDEL: FidelFamily[] = BASES.map((base) => {
  const forms = Array.from({ length: 7 }, (_, i) => at(base, i));
  if (WA_AT_7.has(base)) forms.push(at(base, 7));
  if (VELAR_WA[base]) forms.push(VELAR_WA[base]);
  return { base, forms };
});

const FAMILY_OF: Record<string, string> = Object.fromEntries(
  FIDEL.flatMap((f) => f.forms.map((c) => [c, f.base] as const)),
);

/** The family a character belongs to (its first-order form), or the character itself if it is not fidel. */
export function familyOf(char: string): string {
  return FAMILY_OF[char] ?? char;
}

/** True if the in-game keyboard can type this character. */
export function isTypeable(char: string): boolean {
  return char in FAMILY_OF;
}

/** Split a word into characters. Every fidel character is one code point. */
export function splitFidel(word: string): string[] {
  return Array.from(word);
}
