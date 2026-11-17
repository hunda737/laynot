import type { CategoryId } from '@/data/questions';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  /** Brand red dark enough to carry small white text, in both themes. */
  primaryStrong: string;
  success: string;
  successSoft: string;
  successStrong: string;
  danger: string;
  dangerSoft: string;
  dangerStrong: string;
  gold: string;
  goldSoft: string;
  goldStrong: string;
  sponsor: string;
  /** Sponsor purple dark enough to carry white text, in both themes. */
  sponsorStrong: string;
  sponsorSoft: string;
  /** Near-black in light, near-white in dark: the tab bar and the strongest buttons. */
  ink: string;
  inkPressed: string;
  onInk: string;
  /** Text and icons on any filled colour block (heroes, tiles, sponsor colours). */
  onAccent: string;
  overlay: string;
}

export const light: Palette = {
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEEF2',
  border: '#E0E3E9',
  text: '#111318',
  textMuted: '#5F6672',
  primary: '#E5432A',
  primaryPressed: '#C73620',
  onPrimary: '#FFFFFF',
  primarySoft: '#FCE4DF',
  primaryStrong: '#D93A21',
  success: '#17904D',
  successSoft: '#DDF3E5',
  successStrong: '#15803D',
  danger: '#D0312D',
  dangerSoft: '#FBE1DF',
  dangerStrong: '#D0312D',
  gold: '#B98400',
  goldSoft: '#FBEFCB',
  goldStrong: '#946200',
  sponsor: '#5B3FD0',
  sponsorStrong: '#5B3FD0',
  sponsorSoft: '#E9E4FB',
  ink: '#14161B',
  inkPressed: '#2A2D35',
  onInk: '#FFFFFF',
  onAccent: '#FFFFFF',
  overlay: 'rgba(15, 18, 23, 0.55)',
};

export const dark: Palette = {
  bg: '#0F0F11',
  surface: '#1A1A1E',
  surfaceAlt: '#25252B',
  border: '#303037',
  text: '#F2F3F5',
  textMuted: '#9CA2AD',
  primary: '#FF5C3D',
  primaryPressed: '#E54A2C',
  onPrimary: '#FFFFFF',
  primarySoft: '#3A1D17',
  primaryStrong: '#D93A21',
  success: '#3CCB78',
  successSoft: '#163323',
  successStrong: '#15803D',
  danger: '#FF6461',
  dangerSoft: '#3A1918',
  dangerStrong: '#D0312D',
  gold: '#F5C24C',
  goldSoft: '#3A2F12',
  goldStrong: '#946200',
  sponsor: '#A08BFF',
  sponsorStrong: '#5A43D1',
  sponsorSoft: '#251F42',
  ink: '#F2F3F5',
  inkPressed: '#D9DCE1',
  onInk: '#14161B',
  onAccent: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

/** Colours that never flip with the theme: content on a white chip inside a coloured block. */
export const fixed = { white: '#FFFFFF', ink: '#14161B', inkMuted: '#5F6672' } as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const type = {
  display: { fontSize: 44, fontWeight: '800', letterSpacing: -1.2 },
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 23 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 23 },
  small: { fontSize: 13, fontWeight: '500' },
  tiny: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  question: { fontSize: 21, fontWeight: '700', lineHeight: 29 },
  number: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
} as const;

export interface Shadows {
  /** Barely-there lift for cards sitting on the page background. */
  card: { boxShadow?: string };
  /** Floating elements: the tab bar. */
  float: { boxShadow?: string };
}

export const shadow: Record<'light' | 'dark', Shadows> = {
  light: {
    card: { boxShadow: '0 1px 2px rgba(17, 19, 24, 0.06)' },
    float: { boxShadow: '0 8px 24px rgba(17, 19, 24, 0.14)' },
  },
  dark: {
    card: {},
    float: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' },
  },
};

export interface CategoryColor {
  /** Filled tile colour. Carries white text in both themes. */
  solid: string;
  /** Tinted background for icon chips and rows. */
  soft: string;
  /** Icon and text colour on `soft` and on the page. */
  fg: string;
}

const SOLID: Record<CategoryId, string> = {
  ethiopia: '#925B06',
  geography: '#1D4ED8',
  football: '#15803D',
  science: '#0E7490',
  movies: '#7E22CE',
  entertainment: '#BE185D',
  general: '#475569',
  books: '#0F766E',
};

export const categoryColors: Record<'light' | 'dark', Record<CategoryId, CategoryColor>> = {
  light: {
    ethiopia: { solid: SOLID.ethiopia, soft: '#FEF3C7', fg: '#925B06' },
    geography: { solid: SOLID.geography, soft: '#DBEAFE', fg: '#1D4ED8' },
    football: { solid: SOLID.football, soft: '#DCFCE7', fg: '#15803D' },
    science: { solid: SOLID.science, soft: '#CFFAFE', fg: '#0E7490' },
    movies: { solid: SOLID.movies, soft: '#F3E8FF', fg: '#7E22CE' },
    entertainment: { solid: SOLID.entertainment, soft: '#FCE7F3', fg: '#BE185D' },
    general: { solid: SOLID.general, soft: '#E2E8F0', fg: '#475569' },
    books: { solid: SOLID.books, soft: '#CCFBF1', fg: '#0F766E' },
  },
  dark: {
    ethiopia: { solid: SOLID.ethiopia, soft: '#33270B', fg: '#FBBF24' },
    geography: { solid: SOLID.geography, soft: '#162449', fg: '#8FB0FF' },
    football: { solid: SOLID.football, soft: '#12301D', fg: '#4ADE80' },
    science: { solid: SOLID.science, soft: '#0C2F38', fg: '#22D3EE' },
    movies: { solid: SOLID.movies, soft: '#2B1846', fg: '#C99BFF' },
    entertainment: { solid: SOLID.entertainment, soft: '#3B1529', fg: '#F472B6' },
    general: { solid: SOLID.general, soft: '#262B33', fg: '#CBD5E1' },
    books: { solid: SOLID.books, soft: '#0D2F2C', fg: '#2DD4BF' },
  },
};

/** Game modes get their own colours, so the sponsor purple only ever means "sponsored". */
export const modeColors = { duel: '#4338CA', live: '#A21CAF', flash: '#6D28D9', review: '#0F766E' } as const;

/** Gold, silver, bronze. */
export const medals = ['#E2A400', '#9CA3AF', '#B87333'] as const;
