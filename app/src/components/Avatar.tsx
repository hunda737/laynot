import { View } from 'react-native';

import { hashString } from '@/lib/rng';
import { useTheme } from '@/theme/useTheme';
import { Icon, Txt } from './ui';

const COLORS = ['#D93A21', '#1D4ED8', '#15803D', '#7E22CE', '#925B06', '#BE185D', '#0E7490', '#4D7C0F'];

/** A circle with the first letter of a name. With no name it shows a person icon (a guest). */
export function Avatar({ name, size = 36, color }: { name?: string | null; size?: number; color?: string }) {
  const { colors } = useTheme();
  const bg = color ?? (name ? COLORS[hashString(name) % COLORS.length] : colors.surfaceAlt);
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      {name ? (
        <Txt tone="onAccent" style={{ fontWeight: '800', fontSize: size * 0.42 }}>
          {name.slice(0, 1).toUpperCase()}
        </Txt>
      ) : (
        <Icon name="person" size={size * 0.5} color={colors.textMuted} />
      )}
    </View>
  );
}
