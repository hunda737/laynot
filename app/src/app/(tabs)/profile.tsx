import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FadeInUp, useCountUp } from '@/components/motion';
import { Button, Card, Icon, ProgressBar, Screen, SectionHeader, StatTile, Txt, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/data/questions';
import { STREET_EPISODES } from '@/data/street';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT, type StringKey } from '@/i18n';
import { outcome } from '@/lib/duel';
import { effectiveStreak } from '@/lib/streak';
import { useGame } from '@/store/useGameStore';
import { useReducedMotion } from '@/theme/motion';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Sections after this one arrive together. */
const MAX_STAGGER = 11;

interface Tint {
  bg: string;
  fg: string;
}

export default function Profile() {
  const { colors, cat } = useTheme();
  const { t, lang } = useT();
  const today = useToday();
  const profile = useGame((s) => s.profile);
  const streak = useGame((s) => s.streak);
  const coins = useGame((s) => s.coins);
  const history = useGame((s) => s.dailyHistory);
  const topicStats = useGame((s) => s.topicStats);
  const streetResults = useGame((s) => s.streetResults);
  const missedCount = useGame((s) => s.missed.length);
  const flash = useGame((s) => s.flashStats);
  const duels = useGame((s) => s.duels);
  const live = useGame((s) => s.liveStats);
  const record = useMemo(() => {
    const r = { w: 0, l: 0, d: 0 };
    for (const d of duels) {
      if (!d.mine || !d.theirs || !d.claimed) continue;
      const o = outcome(d.mine, d.theirs);
      if (o === 'win') r.w++;
      else if (o === 'loss') r.l++;
      else r.d++;
    }
    return r;
  }, [duels]);

  const days = Object.values(history).sort((a, b) => b.day.localeCompare(a.day));
  const totalPoints = useMemo(() => Object.values(history).reduce((sum, r) => sum + r.score, 0), [history]);
  const playedTopics = CATEGORIES.filter((c) => topicStats[c.id]);
  const episodesPlayed = Object.keys(streetResults).length;

  const onColor = (bg: string): Tint => ({ bg, fg: colors.onAccent });
  const links: { icon: IconName; title: string; body?: string; tint: Tint; onPress: () => void }[] = [
    {
      icon: 'mic',
      title: t('profile.street'),
      body: t('profile.episodes', { n: episodesPlayed, total: STREET_EPISODES.length }),
      tint: { bg: cat.entertainment.soft, fg: cat.entertainment.fg },
      onPress: () => router.push('/street'),
    },
    {
      icon: 'flash',
      title: t('duel.title'),
      body: t('duel.record', record),
      tint: onColor(modeColors.duel),
      onPress: () => router.push('/duels'),
    },
    {
      icon: 'people',
      title: t('live.title'),
      body: t('live.stats', { played: live.played, wins: live.wins }),
      tint: onColor(modeColors.live),
      onPress: () => router.push('/live'),
    },
    {
      icon: 'albums',
      title: t('flash.title'),
      body:
        flash.rounds > 0
          ? t('flash.stats', { n: Math.round((100 * flash.known) / Math.max(flash.seen, 1)), rounds: flash.rounds })
          : t('flash.tile'),
      tint: onColor(modeColors.flash),
      onPress: () => router.push('/flashcards'),
    },
    ...(missedCount > 0
      ? [
          {
            icon: 'refresh' as const,
            title: t('review.title'),
            body: t('review.count', { n: missedCount }),
            tint: onColor(modeColors.review),
            onPress: () => router.push('/review'),
          },
        ]
      : []),
    {
      icon: 'trophy',
      title: t('profile.prizes'),
      tint: { bg: colors.goldSoft, fg: colors.gold },
      onPress: () => router.push('/prizes'),
    },
    {
      icon: 'settings-outline',
      title: t('profile.settings'),
      tint: { bg: colors.surfaceAlt, fg: colors.text },
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <Screen tabBarInset>
      <FadeInUp index={0} style={styles.head}>
        <Avatar name={profile?.name} size={64} color={profile ? colors.primaryStrong : undefined} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title" numberOfLines={1}>
            {profile?.name ?? t('profile.guest')}
          </Txt>
          {profile && (
            <Txt variant="small" tone="muted">
              +251 {profile.phone} · {t('profile.member', { date: formatDay(lang, profile.joinedDay) })}
            </Txt>
          )}
        </View>
      </FadeInUp>

      {!profile && (
        <FadeInUp index={1}>
          <LinkRow
            icon="shield-checkmark"
            title={t('profile.signupCta')}
            tint={{ bg: colors.primarySoft, fg: colors.primary }}
            onPress={() => router.push('/signup')}
            accent
          />
        </FadeInUp>
      )}

      <FadeInUp index={2} style={styles.stats}>
        <CountTile
          icon="star"
          iconColor={cat.geography.fg}
          iconBg={cat.geography.soft}
          value={totalPoints}
          label={t('profile.totalPoints')}
          style={styles.wide}
        />
        <CountTile
          icon="flame"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          value={effectiveStreak(streak, today)}
          label={t('profile.streak')}
        />
        <CountTile
          icon="ribbon"
          iconColor={cat.movies.fg}
          iconBg={cat.movies.soft}
          value={streak.best}
          label={t('profile.best')}
        />
        <CountTile
          icon="calendar"
          iconColor={colors.success}
          iconBg={colors.successSoft}
          value={days.length}
          label={t('profile.played')}
        />
        <CountTile icon="ellipse" iconColor={colors.gold} iconBg={colors.goldSoft} value={coins} label={t('profile.coins')} />
      </FadeInUp>

      <FadeInUp index={3} style={styles.section}>
        <SectionHeader title={t('home.dailyTitle')} />
        {days.length === 0 ? (
          <Card style={{ alignItems: 'center' }}>
            <Icon name="calendar-outline" size={32} color={colors.textMuted} />
            <Txt tone="muted" center>
              {t('profile.firstDaily')}
            </Txt>
            <Button small label={t('home.dailyCta')} icon="play" onPress={() => router.push('/daily/play')} />
          </Card>
        ) : (
          <View style={styles.list}>
            {days.slice(0, 7).map((r, i) => (
              <FadeInUp key={r.day} index={3 + i}>
                <Card style={styles.row} onPress={() => router.push({ pathname: '/daily/result', params: { day: r.day } })}>
                  <View style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                    <Icon name="calendar" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {formatDay(lang, r.day)}
                    </Txt>
                    <Txt variant="small" tone="muted">
                      {r.correct}/{r.total}
                    </Txt>
                  </View>
                  <Txt variant="heading" style={styles.score}>
                    {r.score}
                  </Txt>
                  <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                </Card>
              </FadeInUp>
            ))}
          </View>
        )}
      </FadeInUp>

      {playedTopics.length > 0 && (
        <FadeInUp index={4} style={styles.section}>
          <SectionHeader title={t('profile.topics')} />
          <Card style={{ gap: space.lg }}>
            {playedTopics.map((c) => {
              const s = topicStats[c.id]!;
              const pct = Math.round((s.correct / Math.max(1, s.answered)) * 100);
              return (
                <View key={c.id} style={styles.topic}>
                  <View style={[styles.chip, { backgroundColor: cat[c.id].soft }]}>
                    <Icon name={c.icon as IconName} size={18} color={cat[c.id].fg} />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.topicHead}>
                      <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {t(`cat.${c.id}` as StringKey)}
                      </Txt>
                      <Txt variant="small" tone="muted">
                        {t('profile.accuracy', { n: pct, rounds: s.rounds })}
                      </Txt>
                    </View>
                    <ProgressBar value={pct} max={100} color={cat[c.id].fg} />
                  </View>
                </View>
              );
            })}
          </Card>
        </FadeInUp>
      )}

      <View style={styles.list}>
        {links.map((link, i) => (
          <FadeInUp key={link.icon} index={Math.min(5 + i, MAX_STAGGER)}>
            <LinkRow {...link} />
          </FadeInUp>
        ))}
      </View>
    </Screen>
  );
}

/** Counts up from zero the first time the screen shows, then follows the value. */
function useCountIn(value: number): number {
  const reduced = useReducedMotion();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return useCountUp(armed || reduced ? value : 0);
}

function CountTile({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  style,
}: {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const shown = useCountIn(value);
  return (
    <StatTile
      icon={icon}
      iconColor={iconColor}
      iconBg={iconBg}
      value={shown.toLocaleString('en-US')}
      label={label}
      style={style}
    />
  );
}

function LinkRow({
  icon,
  title,
  body,
  tint,
  onPress,
  accent,
}: {
  icon: IconName;
  title: string;
  body?: string;
  tint: Tint;
  onPress: () => void;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={[styles.row, accent && { borderColor: colors.primary }]}>
      <View style={[styles.chip, { backgroundColor: tint.bg }]}>
        <Icon name={icon} size={18} color={tint.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {body && (
          <Txt variant="small" tone="muted">
            {body}
          </Txt>
        )}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  wide: { flexBasis: '100%' },
  section: { gap: space.md },
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  chip: { width: 38, height: 38, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  score: { minWidth: 48, textAlign: 'right', fontVariant: ['tabular-nums'] },
  topic: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
