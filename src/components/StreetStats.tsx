import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { StreetQuestion } from '@/data/street';
import { useT } from '@/i18n';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './ui';

/** How the people on the street answered, one bar per choice, grown in after the reveal. */
export function StreetStats({ question, order, pick }: { question: StreetQuestion; order: number[]; pick: number | null }) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const [grow] = useState(() => new Animated.Value(0));

  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, { toValue: 1, duration: 700, useNativeDriver: false }).start();
  }, [question.id, grow]);

  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="tiny" tone="muted">
        {t('street.statsTitle').toUpperCase()}
      </Txt>
      {order.map((choice) => {
        const pct = question.streetPicks[choice];
        const correct = choice === 0;
        const mine = pick === choice;
        return (
          <View key={choice} style={{ gap: 3 }}>
            <View style={styles.labelRow}>
              <Txt variant="small" style={{ flex: 1, fontWeight: correct || mine ? '800' : '500' }} numberOfLines={1}>
                {L(question.choices[choice])}
                {mine ? `  ·  ${t('street.yourPick')}` : ''}
              </Txt>
              <Txt variant="small" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {pct}%
              </Txt>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surface }]}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    backgroundColor: correct ? colors.success : mine ? colors.danger : colors.textMuted,
                    opacity: correct || mine ? 1 : 0.45,
                    width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }),
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
      <Txt variant="bodyStrong">{t('street.gotRight', { n: question.streetPicks[0] })}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
