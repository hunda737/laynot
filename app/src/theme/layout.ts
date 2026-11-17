import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The floating tab bar: a pill that sits above the bottom edge. */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 12;

/** Space a tab screen must leave at the bottom so nothing hides behind the floating tab bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_GAP + Math.max(insets.bottom, TAB_BAR_GAP);
}
