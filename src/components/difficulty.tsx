import { StyleSheet, Text, View } from 'react-native';

import type { Difficulty } from '@/data/questions';
import { useT, type StringKey } from '@/i18n';
import { LEVEL_CHOICES, type LevelChoice } from '@/lib/difficulty';
import { radius, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Segmented, Txt } from './ui';

export const levelLabel = (level: LevelChoice): StringKey => `level.${level}` as StringKey;

/** Small coloured tag: green for easy, gold for medium, red for hard. */
export function DifficultyBadge({ level }: { level: Difficulty }) {
  const { colors } = useTheme();
  const { t } = useT();
  const tone = {
    easy: { fg: colors.success, bg: colors.successSoft },
    medium: { fg: colors.gold, bg: colors.goldSoft },
    hard: { fg: colors.danger, bg: colors.dangerSoft },
  }[level];
  const bars = level === 'easy' ? 1 : level === 'medium' ? 2 : 3;
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]} accessibilityLabel={t(levelLabel(level))}>
      <View style={styles.bars}>
        {[1, 2, 3].map((b) => (
          <View
            key={b}
            style={[styles.bar, { height: 3 + b * 3, backgroundColor: b <= bars ? tone.fg : `${String(tone.fg)}44` }]}
          />
        ))}
      </View>
      <Text style={[typeScale.tiny, { color: tone.fg }]}>{t(levelLabel(level)).toUpperCase()}</Text>
    </View>
  );
}

/** Mixed / Easy / Medium / Hard. */
export function DifficultyPicker({ value, onChange }: { value: LevelChoice; onChange: (v: LevelChoice) => void }) {
  const { t } = useT();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="tiny" tone="muted">
        {t('level.title').toUpperCase()}
      </Txt>
      <Segmented options={LEVEL_CHOICES.map((l) => ({ value: l, label: t(levelLabel(l)) }))} value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 1 },
});
