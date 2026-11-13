import { useColorScheme } from 'react-native';

import { useGame } from '@/store/useGameStore';
import { dark, light, type Palette } from './tokens';

export interface Theme {
  colors: Palette;
  scheme: 'light' | 'dark';
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const pref = useGame((s) => s.themePref);
  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return { colors: scheme === 'dark' ? dark : light, scheme };
}
