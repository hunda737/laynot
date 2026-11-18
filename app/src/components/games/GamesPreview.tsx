import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useOpenGame } from '@/hooks/useOpenGame';
import { useT } from '@/i18n';
import type { DayGames } from '@/lib/games/common';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from '../motion';
import { Icon, SectionHeader, Txt } from '../ui';
import { GAME_CARDS } from './catalog';

/**
 * The Games row on Home: one tile per game. A tile opens that game's daily puzzle
 * (free, no life needed); "See all" goes to the Games tab for practice and rules.
 */
export function GamesPreview({ today }: { today: DayGames | undefined }) {
  const { colors } = useTheme();
  const { t } = useT();
  const open = useOpenGame();

  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title={t('games.title')} actionLabel={t('common.seeAll')} onAction={() => router.navigate('/games')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row}>
        {GAME_CARDS.map((card) => {
          const done = card.ids.filter((x) => today?.[x.id]);
          const points = done.reduce((sum, x) => sum + (today?.[x.id]?.points ?? 0), 0);
          const allDone = done.length === card.ids.length;
          return (
            <PressableScale
              key={card.kind}
              accessibilityRole="button"
              accessibilityLabel={`${t(card.title)}, ${allDone ? t('games.donePoints', { n: points }) : t('games.playToday')}`}
              onPress={() => open.daily(card.kind)}
              scaleTo={0.96}
              style={[styles.tile, { backgroundColor: modeColors[card.kind] }]}
            >
              <View style={[styles.watermark, { pointerEvents: 'none' }]}>
                <Icon name={card.icon} size={84} color="rgba(255,255,255,0.14)" />
              </View>
              <View style={styles.icon}>
                <Icon name={card.icon} size={20} color={colors.onAccent} />
              </View>
              <Txt variant="bodyStrong" tone="onAccent" numberOfLines={2} style={{ flex: 1 }}>
                {t(card.title)}
              </Txt>
              <View style={[styles.status, { backgroundColor: allDone ? colors.onAccent : 'rgba(0,0,0,0.22)' }]}>
                <Icon
                  name={allDone ? 'checkmark-circle' : 'play'}
                  size={13}
                  color={allDone ? modeColors[card.kind] : colors.onAccent}
                />
                <Txt variant="tiny" style={{ color: allDone ? modeColors[card.kind] : colors.onAccent, fontWeight: '800' }}>
                  {allDone ? t('games.donePoints', { n: points }) : t('games.playToday')}
                </Txt>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -space.lg },
  row: { paddingHorizontal: space.lg, gap: space.md },
  tile: { width: 148, height: 148, borderRadius: radius.lg, padding: space.md, gap: space.sm, overflow: 'hidden' },
  watermark: { position: 'absolute', right: -14, bottom: -14 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
