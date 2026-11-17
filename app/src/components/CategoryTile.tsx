import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CATEGORIES, type CategoryId } from '@/data/questions';
import { useT, type StringKey } from '@/i18n';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from './motion';
import { Icon, Txt, type IconName } from './ui';

const ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon])) as Record<CategoryId, string>;

/**
 * A category as a block of its own colour.
 * `sm` is icon-only (decoration), `md` is the fixed-size tile in a sideways scroller,
 * `grid` stretches to fill a grid cell.
 */
export function CategoryTile({
  id,
  size = 'md',
  caption,
  badge,
  onPress,
  style,
}: {
  id: CategoryId;
  size?: 'sm' | 'md' | 'grid';
  caption?: string;
  /** Shown in the top-right corner, e.g. a "Sponsored" badge. */
  badge?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { cat, scheme, colors } = useTheme();
  const { t } = useT();
  const name = t(`cat.${id}` as StringKey);
  const edge = scheme === 'dark' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' };
  const icon = ICONS[id] as IconName;

  if (size === 'sm') {
    return (
      <View style={[styles.small, { backgroundColor: cat[id].solid }, edge, style]}>
        <Icon name={icon} size={26} color={colors.onAccent} />
      </View>
    );
  }

  const body = (
    <>
      <View style={[styles.blob, { pointerEvents: 'none' }]} />
      <View style={styles.top}>
        <View style={styles.iconChip}>
          <Icon name={icon} size={22} color={colors.onAccent} />
        </View>
        {badge}
      </View>
      <View style={{ gap: 2 }}>
        <Txt variant="bodyStrong" tone="onAccent" numberOfLines={2} style={{ fontWeight: '800', lineHeight: 20 }}>
          {name}
        </Txt>
        {caption ? (
          <Txt variant="small" tone="onAccent" numberOfLines={1} style={{ opacity: 0.85 }}>
            {caption}
          </Txt>
        ) : null}
      </View>
    </>
  );

  const base = [styles.tile, size === 'md' ? styles.medium : styles.grid, { backgroundColor: cat[id].solid }, edge, style];
  if (!onPress) return <View style={base}>{body}</View>;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={name} style={base} scaleTo={0.95} tapHaptic>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  small: { width: 64, height: 64, borderRadius: radius.md + 4, alignItems: 'center', justifyContent: 'center' },
  tile: { borderRadius: radius.lg, padding: space.md, justifyContent: 'space-between', overflow: 'hidden' },
  medium: { width: 124, height: 132 },
  grid: { flexBasis: '46%', flexGrow: 1, minHeight: 132, gap: space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -40,
    top: -44,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
});
