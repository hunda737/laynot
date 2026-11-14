import { View } from 'react-native';

import { hashString } from '@/lib/rng';
import { Txt } from './ui';

const COLORS = ['#E5432A', '#2563EB', '#059669', '#7C3AED', '#D97706', '#DB2777', '#0891B2', '#65A30D'];

export function Avatar({ name, size = 36, color }: { name: string; size?: number; color?: string }) {
  const bg = color ?? COLORS[hashString(name) % COLORS.length];
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt style={{ color: '#FFFFFF', fontWeight: '800', fontSize: size * 0.42 }}>{name.slice(0, 1).toUpperCase()}</Txt>
    </View>
  );
}
