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
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  gold: string;
  goldSoft: string;
  sponsor: string;
  sponsorSoft: string;
  overlay: string;
}

export const light: Palette = {
  bg: '#F6F4F0',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEBE5',
  border: '#E2DED6',
  text: '#17150F',
  textMuted: '#6A655B',
  primary: '#E5432A',
  primaryPressed: '#C73620',
  onPrimary: '#FFFFFF',
  primarySoft: '#FCE4DF',
  success: '#17904D',
  successSoft: '#DDF3E5',
  danger: '#D0312D',
  dangerSoft: '#FBE1DF',
  gold: '#B98400',
  goldSoft: '#FBEFCB',
  sponsor: '#5B3FD0',
  sponsorSoft: '#E9E4FB',
  overlay: 'rgba(10, 9, 8, 0.55)',
};

export const dark: Palette = {
  bg: '#0F0F11',
  surface: '#1A1A1E',
  surfaceAlt: '#25252B',
  border: '#303037',
  text: '#F5F3EF',
  textMuted: '#A39E95',
  primary: '#FF5C3D',
  primaryPressed: '#E54A2C',
  onPrimary: '#FFFFFF',
  primarySoft: '#3A1D17',
  success: '#3CCB78',
  successSoft: '#163323',
  danger: '#FF6461',
  dangerSoft: '#3A1918',
  gold: '#F5C24C',
  goldSoft: '#3A2F12',
  sponsor: '#A08BFF',
  sponsorSoft: '#251F42',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const type = {
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
