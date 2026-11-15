import { StyleSheet, View } from 'react-native';

import { useT, WEEKDAY_LETTERS } from '@/i18n';
import type { StripDay } from '@/lib/streak';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PopIn, Pulse } from './motion';
import { Icon, Txt } from './ui';

const DOT = 30;

/**
 * This week at a glance, Monday to Sunday: a flame on each day of the live streak,
 * a ring around today. When the streak is about to end, today's ring turns gold and pulses.
 */
export function WeekStreak({ days, streak, atRisk }: { days: StripDay[]; streak: number; atRisk: boolean }) {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const letters = WEEKDAY_LETTERS[lang];

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.head}>
        <Icon name="flame" size={18} color={streak > 0 ? colors.primary : colors.textMuted} />
        <Txt variant="small" style={{ fontWeight: '800', flex: 1 }} tone={atRisk ? 'gold' : 'text'} numberOfLines={2}>
          {atRisk
            ? t('home.atRisk', { n: streak })
            : streak > 0
              ? t('home.streakDays', { n: streak })
              : t('home.streakStart')}
        </Txt>
      </View>

      <View style={styles.row}>
        {days.map((d, i) => {
          const ringColor = atRisk ? colors.gold : colors.primary;
          return (
            <View key={d.day} style={styles.cell}>
              <Txt
                variant="tiny"
                tone={d.isToday ? 'text' : 'muted'}
                style={{ letterSpacing: 0 }}
              >
                {letters[i]}
              </Txt>
              <PopIn index={i} delay={120}>
                <Pulse active={d.state === 'today' && atRisk}>
                  {d.state === 'streak' ? (
                    <View style={[styles.dot, { backgroundColor: colors.primary }]}>
                      <Icon name="flame" size={16} color={colors.onPrimary} />
                    </View>
                  ) : d.state === 'played' ? (
                    <View style={[styles.dot, { backgroundColor: colors.primarySoft }]}>
                      <Icon name="checkmark" size={16} color={colors.primary} />
                    </View>
                  ) : d.state === 'today' ? (
                    <View style={[styles.dot, { borderWidth: 2.5, borderColor: ringColor, backgroundColor: colors.surface }]}>
                      <View style={[styles.pip, { backgroundColor: ringColor }]} />
                    </View>
                  ) : d.state === 'missed' ? (
                    <View style={[styles.dot, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.pip, { backgroundColor: colors.border }]} />
                    </View>
                  ) : (
                    <View style={[styles.dot, { borderWidth: 1.5, borderColor: colors.border }]} />
                  )}
                </Pulse>
              </PopIn>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  pip: { width: 6, height: 6, borderRadius: 3 },
});
