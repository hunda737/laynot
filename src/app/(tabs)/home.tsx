import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { Avatar } from '@/components/Avatar';
import { CategoryTile } from '@/components/CategoryTile';
import { FadeInUp, PressableScale, useCountUp } from '@/components/motion';
import { CoinChip, Hearts } from '@/components/status';
import { Badge, Button, Card, HeroCard, Icon, IconButton, ProgressBar, Screen, SectionHeader, Txt } from '@/components/ui';
import { WeekStreak } from '@/components/WeekStreak';
import { CATEGORIES, QUESTIONS, type CategoryId } from '@/data/questions';
import { STREET_EPISODES } from '@/data/street';
import { useDuels } from '@/hooks/useDuels';
import { useNow } from '@/hooks/useNow';
import { useOpenTopic } from '@/hooks/useOpenTopic';
import { useT } from '@/i18n';
import { dailyNumber, dayKey, formatCountdown, msUntilNextDay } from '@/lib/clock';
import { DAILY_COUNT } from '@/lib/daily';
import { effectiveStreak, streakAtRisk, weekStrip } from '@/lib/streak';
import { useGame } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const QUESTION_COUNT = QUESTIONS.reduce<Partial<Record<CategoryId, number>>>((counts, q) => {
  counts[q.category] = (counts[q.category] ?? 0) + 1;
  return counts;
}, {});

/** Categories that have questions to play. */
const PLAYABLE = CATEGORIES.filter((c) => (QUESTION_COUNT[c.id] ?? 0) > 0);

/** The newest Beat the Street episode. */
const FEATURED = [...STREET_EPISODES].sort((a, b) => b.posted.localeCompare(a.posted))[0];

export default function Home() {
  const { colors } = useTheme();
  const { t, L } = useT();
  const now = useNow();
  const today = dayKey(now);
  const [scrollY] = useState(() => new Animated.Value(0));

  const profile = useGame((s) => s.profile);
  const streak = useGame((s) => s.streak);
  const history = useGame((s) => s.dailyHistory);
  const progress = useGame((s) => s.dailyProgress);
  const topicStats = useGame((s) => s.topicStats);
  const streetResults = useGame((s) => s.streetResults);

  const record = history[today];
  const points = useMemo(() => Object.values(history).reduce((sum, r) => sum + r.score, 0), [history]);
  const shownPoints = useCountUp(points);
  const days = useMemo(() => weekStrip(history, streak, today), [history, streak, today]);
  const streakNow = effectiveStreak(streak, today);
  const atRisk = streakAtRisk(streak, today) && !record;
  const answered = progress?.day === today ? progress.answers.length : 0;

  const { yourTurn } = useDuels(30_000);
  const topic = useOpenTopic();

  return (
    <Screen tabBarInset scrollY={scrollY}>
      <FadeInUp index={0} style={styles.top}>
        <Pressable
          style={styles.who}
          onPress={() => router.push(profile ? '/profile' : '/signup')}
          accessibilityRole="button"
        >
          <Avatar name={profile?.name} size={44} />
          <View style={{ flex: 1 }}>
            <Txt variant="title" numberOfLines={1}>
              {profile ? profile.name : t('profile.guest')}
            </Txt>
            {!profile && (
              <Txt variant="small" tone="primary" style={{ fontWeight: '700' }}>
                {t('home.signUp')}
              </Txt>
            )}
          </View>
        </Pressable>
        <CoinChip />
        <IconButton icon="settings-outline" label={t('settings.title')} onPress={() => router.push('/settings')} />
      </FadeInUp>

      <FadeInUp index={1}>
        <Card style={{ gap: space.lg }}>
          <View style={styles.stats}>
            <PressableScale style={{ flex: 1 }} onPress={() => router.push('/ranks')} accessibilityRole="button">
              <Txt variant="tiny" tone="muted">
                {t('home.points').toUpperCase()}
              </Txt>
              <Txt variant="display" numberOfLines={1} adjustsFontSizeToFit style={{ fontVariant: ['tabular-nums'] }}>
                {shownPoints.toLocaleString('en-US')}
              </Txt>
            </PressableScale>
            <View style={styles.lives}>
              <Txt variant="tiny" tone="muted">
                {t('home.lives').toUpperCase()}
              </Txt>
              <Hearts size="lg" onPress={topic.lives > 0 ? () => router.push('/topics') : topic.showSheet} />
            </View>
          </View>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
          <WeekStreak days={days} streak={atRisk ? streak.current : streakNow} atRisk={atRisk} />
        </Card>
      </FadeInUp>

      <FadeInUp index={2}>
        <HeroCard color={colors.primaryStrong} scrollY={scrollY} watermark={record ? 'trophy' : undefined}>
          <View style={styles.heroLabel}>
            <Icon name="calendar" size={14} color={colors.onAccent} />
            <Txt variant="tiny" tone="onAccent">
              {t('result.title', { n: dailyNumber(today) }).toUpperCase()}
            </Txt>
          </View>
          {record ? (
            <>
              <Txt variant="small" tone="onAccent" style={{ opacity: 0.9 }}>
                {t('home.dailyPlayed')}
              </Txt>
              <Txt variant="number" tone="onAccent" style={{ fontVariant: ['tabular-nums'] }}>
                {record.score}{' '}
                <Txt variant="heading" tone="onAccent">
                  {t('common.pts')}
                </Txt>
              </Txt>
              <Txt variant="small" tone="onAccent" style={{ opacity: 0.9 }}>
                {t('home.dailyNext', { time: formatCountdown(msUntilNextDay(now)) })}
              </Txt>
              <Button label={t('home.dailySee')} kind="ink" onPress={() => router.push('/daily/result')} style={styles.heroCta} />
            </>
          ) : (
            <>
              <Txt variant="title" tone="onAccent">
                {t('home.dailyHeadline')}
              </Txt>
              <View style={styles.progress}>
                <ProgressBar
                  value={answered}
                  max={DAILY_COUNT}
                  color={colors.onAccent}
                  trackColor="rgba(255,255,255,0.28)"
                  style={{ flex: 1 }}
                />
                <Txt variant="small" tone="onAccent" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                  {answered}/{DAILY_COUNT}
                </Txt>
              </View>
              <Button
                label={answered > 0 ? t('home.dailyResume') : t('home.dailyCta')}
                kind="ink"
                icon="play"
                onPress={() => router.push('/daily/play')}
                style={styles.heroCta}
              />
            </>
          )}
        </HeroCard>
      </FadeInUp>

      <FadeInUp index={3} style={{ gap: space.md }}>
        <SectionHeader title={t('home.categories')} actionLabel={t('common.seeAll')} onAction={() => router.push('/topics')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.tiles}
        >
          {PLAYABLE.map((c) => {
            const best = topicStats[c.id]?.best;
            return (
              <CategoryTile
                key={c.id}
                id={c.id}
                caption={best !== undefined ? t('topics.best', { n: best }) : t('home.catCount', { n: QUESTION_COUNT[c.id] ?? 0 })}
                onPress={() => topic.open(c.id)}
              />
            );
          })}
        </ScrollView>
      </FadeInUp>

      <FadeInUp index={4}>
        <AdBanner placement="home" />
      </FadeInUp>

      <FadeInUp index={5} style={{ gap: space.md }}>
        <SectionHeader title={t('home.friendsTitle')} />
        <View style={styles.pair}>
          <HeroCard color={modeColors.duel} pattern="rings" onPress={() => router.push('/duels')} style={styles.mode}>
            <View style={styles.modeTop}>
              <Icon name="flash" size={26} color={colors.onAccent} />
              {yourTurn > 0 && <Badge label={t('duel.yourTurnCount', { n: yourTurn })} bg={colors.onAccent} fg={modeColors.duel} />}
            </View>
            <Txt variant="heading" tone="onAccent">
              {t('duel.title')}
            </Txt>
            <Txt variant="small" tone="onAccent" numberOfLines={3} style={{ opacity: 0.88 }}>
              {t('duel.home')}
            </Txt>
          </HeroCard>
          <HeroCard color={modeColors.live} pattern="rings" onPress={() => router.push('/live')} style={styles.mode}>
            <View style={styles.modeTop}>
              <Icon name="people" size={26} color={colors.onAccent} />
            </View>
            <Txt variant="heading" tone="onAccent">
              {t('live.title')}
            </Txt>
            <Txt variant="small" tone="onAccent" numberOfLines={3} style={{ opacity: 0.88 }}>
              {t('live.home')}
            </Txt>
          </HeroCard>
        </View>
      </FadeInUp>

      {FEATURED && (
        <FadeInUp index={6} style={{ gap: space.md }}>
          <SectionHeader title={t('home.featured')} actionLabel={t('common.seeAll')} onAction={() => router.push('/street')} />
          <HeroCard
            color={FEATURED.color}
            watermark="mic"
            onPress={() => router.push({ pathname: '/street/[episode]', params: { episode: FEATURED.id } })}
          >
            <View style={styles.modeTop}>
              <Txt variant="tiny" tone="onAccent">
                {t('home.streetTitle').toUpperCase()}
              </Txt>
              {!streetResults[FEATURED.id] && <Badge label={t('street.new').toUpperCase()} bg={colors.onAccent} fg={FEATURED.color} />}
            </View>
            <Txt variant="title" tone="onAccent" numberOfLines={2}>
              {L(FEATURED.title)}
            </Txt>
            <Txt variant="small" tone="onAccent" style={{ opacity: 0.88 }} numberOfLines={1}>
              {L(FEATURED.location)} · {t('street.asked', { n: FEATURED.peopleAsked })}
            </Txt>
          </HeroCard>
        </FadeInUp>
      )}

      {topic.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  stats: { flexDirection: 'row', alignItems: 'flex-end', gap: space.lg },
  lives: { alignItems: 'flex-end', gap: 6, paddingBottom: 8 },
  heroLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 2 },
  heroCta: { marginTop: space.sm, alignSelf: 'flex-start', minWidth: 160 },
  bleed: { marginHorizontal: -space.lg },
  tiles: { paddingHorizontal: space.lg, gap: space.md },
  pair: { flexDirection: 'row', gap: space.md },
  mode: { flex: 1, minHeight: 168 },
  modeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
});
