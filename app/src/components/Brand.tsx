import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Txt } from './ui';

/** Text wordmark until a real logo exists. */
export function Brand({ size = 28 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      <Txt style={{ fontSize: size, fontWeight: '900', letterSpacing: -1, lineHeight: size * 1.15 }}>Laynot</Txt>
      <View
        style={{
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size,
          backgroundColor: colors.primary,
          marginBottom: size * 0.2,
        }}
      />
    </View>
  );
}
