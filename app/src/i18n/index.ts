import { useCallback } from 'react';

import { DAY_MS, formatCountdown, HOUR_MS } from '@/lib/clock';
import { useGame } from '@/store/useGameStore';
import { am } from './am';
import { en, type StringKey } from './en';

export type Language = 'en' | 'am';
export type { StringKey };

/** Text stored in both languages, used by question data. */
export interface Localized {
  en: string;
  am: string;
}

const dictionaries: Record<Language, Record<StringKey, string>> = { en, am };

export type Vars = Record<string, string | number>;

export function translate(lang: Language, key: StringKey, vars?: Vars): string {
  const template = dictionaries[lang][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function useT() {
  const lang = useGame((s) => s.language);
  const t = useCallback((key: StringKey, vars?: Vars) => translate(lang, key, vars), [lang]);
  const L = useCallback((text: Localized) => text[lang] || text.en, [lang]);
  return { t, L, lang };
}

const MONTHS: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  am: ['ጃንዩ', 'ፌብሩ', 'ማርች', 'ኤፕሪ', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ኦክቶ', 'ኖቬም', 'ዲሴም'],
};

/** One letter per weekday, Monday first, for the streak strip. */
export const WEEKDAY_LETTERS: Record<Language, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  am: ['ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ', 'እ'],
};

/** "2d 4h" / "2 ቀን 4 ሰዓት" for spans over a day, otherwise a h:mm:ss countdown. */
export function formatSpan(lang: Language, ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  if (days < 1) return formatCountdown(ms);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  return lang === 'am' ? `${days} ቀን ${hours} ሰዓት` : `${days}d ${hours}h`;
}

/** A rough duration in whole minutes, e.g. "12 min" or "1 h 5 min", for estimates. */
export function formatMinutes(lang: Language, ms: number): string {
  const mins = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const [hu, mu] = lang === 'am' ? ['ሰዓት', 'ደቂቃ'] : ['h', 'min'];
  return h > 0 ? `${h} ${hu}${m ? ` ${m} ${mu}` : ''}` : `${m} ${mu}`;
}

export function formatBirr(lang: Language, amount: number): string {
  return `${amount.toLocaleString('en-US')} ${lang === 'am' ? 'ብር' : 'Birr'}`;
}

/** "14 Nov 2026" from a YYYY-MM-DD key. Gregorian in both languages for now. */
export function formatDay(lang: Language, key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[lang][m - 1]} ${y}`;
}
