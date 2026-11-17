import { useColorScheme } from 'react-native';

import type { CategoryId } from '@/data/questions';
import { useGame } from '@/store/useGameStore';
import { categoryColors, dark, light, shadow, type CategoryColor, type Palette, type Shadows } from './tokens';

export interface Theme {
  colors: Palette;
  scheme: 'light' | 'dark';
  shadow: Shadows;
  /** One accent per quiz category. */
  cat: Record<CategoryId, CategoryColor>;
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const pref = useGame((s) => s.themePref);
  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return {
    colors: scheme === 'dark' ? dark : light,
    scheme,
    shadow: shadow[scheme],
    cat: categoryColors[scheme],
  };
}
