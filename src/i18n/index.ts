import { useCallback } from 'react';

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

/** "14 Nov 2026" from a YYYY-MM-DD key. Gregorian in both languages for now. */
export function formatDay(lang: Language, key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[lang][m - 1]} ${y}`;
}
