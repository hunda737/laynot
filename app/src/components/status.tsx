import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLives } from '@/hooks/useEconomy';
import { useT } from '@/i18n';
import { formatCountdown } from '@/lib/clock';
import { MAX_LIVES } from '@/lib/lives';
import { useGame } from '@/store/useGameStore';
import { fixed, radius, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Pop, PressableScale, Shake } from './motion';
import { Icon } from './ui';

const HEART = { sm: 15, md: 20, lg: 26 } as const;

/**
 * Lives as a row of hearts: filled for a life you have, outlined for one you lost.
 * Shakes when a life goes, pops when one comes back, and counts down to the next refill.
 */
export function Hearts({
  size = 'sm',
  showTimer = true,
  onPress,
}: {
  size?: keyof typeof HEART;
  showTimer?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const { lives, nextAt, now } = useLives();
  const px = HEART[size];
  const label = `${t('home.lives')}: ${lives}/${MAX_LIVES}`;

  // Count losses and gains separately, so a lost life shakes and a returned one pops.
  const [moves, setMoves] = useState({ lost: 0, gained: 0 });
  const previous = useRef(lives);
  useEffect(() => {
    const before = previous.current;
    previous.current = lives;
    if (lives < before) setMoves((m) => ({ ...m, lost: m.lost + 1 }));
    else if (lives > before) setMoves((m) => ({ ...m, gained: m.gained + 1 }));
  }, [lives]);

  const row = (
    <Shake trigger={moves.lost}>
      <Pop trigger={moves.gained} style={styles.row}>
        <View style={[styles.hearts, { gap: size === 'lg' ? 4 : 2 }]}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Icon
              key={i}
              name={i < lives ? 'heart' : 'heart-outline'}
              size={px}
              color={i < lives ? colors.danger : colors.textMuted}
            />
          ))}
        </View>
        {showTimer && nextAt ? (
          <Text style={[typeScale.small, styles.timer, { color: colors.textMuted }]}>{formatCountdown(nextAt - now)}</Text>
        ) : null}
      </Pop>
    </Shake>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label}>
        {row}
      </View>
    );
  }
  return (
    <PressableScale onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      {row}
    </PressableScale>
  );
}

/**
 * A coin amount. With no `amount` it shows the player's balance and pops when it changes.
 * `onColor` is the white chip used inside coloured hero blocks.
 */
export function CoinChip({
  amount,
  prefix = '',
  variant = 'soft',
  size = 'md',
}: {
  amount?: number;
  prefix?: string;
  variant?: 'soft' | 'onColor';
  size?: 'sm' | 'md';
}) {
  const { colors } = useTheme();
  const balance = useGame((s) => s.coins);
  const value = amount ?? balance;
  const onColor = variant === 'onColor';
  return (
    <Pop trigger={value}>
      <View
        style={[
          styles.chip,
          size === 'sm' && styles.chipSmall,
          { backgroundColor: onColor ? fixed.white : colors.goldSoft },
        ]}
      >
        <View style={[styles.coin, { backgroundColor: onColor ? '#E2A400' : colors.gold }]} />
        <Text
          style={[
            typeScale.small,
            { fontWeight: '800', fontVariant: ['tabular-nums'], color: onColor ? fixed.ink : colors.text },
          ]}
        >
          {prefix}
          {value}
        </Text>
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hearts: { flexDirection: 'row', alignItems: 'center' },
  timer: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipSmall: { paddingHorizontal: 9, paddingVertical: 4 },
  coin: { width: 12, height: 12, borderRadius: 6 },
});
