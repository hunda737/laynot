import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { DifficultyPicker } from '@/components/difficulty';
import { FadeInUp, PressableScale } from '@/components/motion';
import { SponsorStrip } from '@/components/SponsorStrip';
import { CoinChip, Hearts } from '@/components/status';
import { Badge, Card, HeroCard, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { CATEGORIES, QUESTIONS, type CategoryId } from '@/data/questions';
import { sponsoredCategory } from '@/data/sponsors';
import { useToday } from '@/hooks/useNow';
import { useOpenTopic } from '@/hooks/useOpenTopic';
import { useT, type StringKey } from '@/i18n';
import { useGame } from '@/store/useGameStore';
import { fixed, modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const QUESTION_COUNT = QUESTIONS.reduce<Partial<Record<CategoryId, number>>>((counts, q) => {
  counts[q.category] = (counts[q.category] ?? 0) + 1;
  return counts;
}, {});

/** Categories that have questions to play. */
const PLAYABLE = CATEGORIES.filter((c) => (QUESTION_COUNT[c.id] ?? 0) > 0);

/** Tiles after this one arrive together. */
const MAX_STAGGER = 11;

export default function Topics() {
  const { colors } = useTheme();
  const { t } = useT();
  const topic = useOpenTopic();
  const stats = useGame((s) => s.topicStats);
  const flash = useGame((s) => s.flashStats);
  const level = useGame((s) => s.topicLevel);
  const setLevel = useGame((s) => s.setTopicLevel);
  const missedCount = useGame((s) => s.missed.length);
  const presented = sponsoredCategory(useToday());
  const sponsoredPlayable = PLAYABLE.some((c) => c.id === presented.category);
  const afterGrid = Math.min(PLAYABLE.length + 3, MAX_STAGGER);

  return (
    <Screen>
      <TopBar
        title={t('topics.title')}
        right={
          <View style={styles.status}>
            <Hearts onPress={topic.lives <= 0 ? topic.showSheet : undefined} />
            <CoinChip />
          </View>
        }
      />

      <FadeInUp index={0} style={{ gap: space.md }}>
        <Txt tone="muted">{t('topics.body')}</Txt>
        <View style={{ gap: 6 }}>
          <DifficultyPicker value={level} onChange={setLevel} />
          <Txt variant="small" tone="muted">
            {t('level.coins')}
          </Txt>
        </View>
      </FadeInUp>

      {sponsoredPlayable && (
        <FadeInUp index={1}>
          <PressableScale
            accessibilityRole="button"
            onPress={() => topic.open(presented.category)}
            style={styles.presented}
            scaleTo={0.98}
          >
            <Txt variant="small" numberOfLines={1} style={{ fontWeight: '800', flexShrink: 1 }}>
              {t(`cat.${presented.category}` as StringKey)}
            </Txt>
            <View style={{ flex: 1, minWidth: 150 }}>
              <SponsorStrip sponsor={presented.sponsor} compact />
            </View>
          </PressableScale>
        </FadeInUp>
      )}

      <View style={styles.grid}>
        {PLAYABLE.map((c, i) => {
          const s = stats[c.id];
          return (
            <FadeInUp key={c.id} index={Math.min(i + 2, MAX_STAGGER)} style={styles.cell}>
              <CategoryTile
                id={c.id}
                size="grid"
                caption={s ? t('topics.best', { n: s.best }) : t('topics.new')}
                badge={
                  presented.category === c.id ? (
                    <Badge label={t('common.sponsored').toUpperCase()} bg={fixed.white} fg={fixed.ink} />
                  ) : undefined
                }
                onPress={() => topic.open(c.id)}
                style={styles.tile}
              />
            </FadeInUp>
          );
        })}
      </View>

      <FadeInUp index={afterGrid}>
        <HeroCard color={modeColors.flash} pattern="rings" onPress={() => router.push('/flashcards')}>
          <View style={styles.row}>
            <View style={styles.flashIcon}>
              <Icon name="albums" size={22} color={colors.onAccent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="heading" tone="onAccent">
                {t('flash.title')}
              </Txt>
              <Txt variant="small" tone="onAccent" style={{ opacity: 0.88 }}>
                {flash.rounds > 0
                  ? t('flash.stats', { n: Math.round((100 * flash.known) / Math.max(flash.seen, 1)), rounds: flash.rounds })
                  : `${t('flash.tile')} · ${t('lives.noLivesNeeded')}`}
              </Txt>
            </View>
            <Icon name="chevron-forward" color={colors.onAccent} />
          </View>
        </HeroCard>
      </FadeInUp>

      {missedCount > 0 && (
        <FadeInUp index={afterGrid}>
          <Card onPress={() => router.push('/review')} style={styles.row}>
            <View style={[styles.reviewIcon, { backgroundColor: modeColors.review }]}>
              <Icon name="refresh" size={18} color={colors.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{t('review.title')}</Txt>
              <Txt variant="small" tone="muted">
                {t('review.count', { n: missedCount })}
              </Txt>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </FadeInUp>
      )}

      {topic.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  presented: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  // The wrapper is the grid cell; the tile fills it.
  cell: { flexBasis: '46%', flexGrow: 1 },
  tile: { flexBasis: 'auto' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flashIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewIcon: { width: 38, height: 38, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
});
