import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FadeInUp, PopIn, PressableScale, useCountUp } from '@/components/motion';
import { Badge, Button, Card, HeroCard, Icon, Screen, Segmented, Txt, type IconName } from '@/components/ui';
import { BOTS } from '@/data/players';
import { PRIZE_AMOUNTS, weeklySponsor } from '@/data/prizes';
import { useBoard } from '@/hooks/useBoard';
import { formatBirr, formatSpan, useT } from '@/i18n';
import { msUntilWeekEnd } from '@/lib/clock';
import { lastWeekBoard, type BoardEntry, type Period } from '@/lib/leaderboard';
import { FRIENDS_LEAGUE_ID, leagueMembers } from '@/lib/league';
import { useGame } from '@/store/useGameStore';
import { duration, NATIVE_DRIVER, useReducedMotion } from '@/theme/motion';
import { fixed, medals, modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Tab = 'global' | 'private';

/** Rows after this one all arrive together, so a long board never keeps the player waiting. */
const MAX_STAGGER = 10;

/** Podium step heights for 1st, 2nd and 3rd place. */
const STEP_HEIGHT = [104, 80, 62];
/** Delay between one podium column starting to rise and the next. */
const RISE_GAP_MS = 130;

export default function Ranks() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const params = useLocalSearchParams<{ league?: string }>();
  const leagues = useGame((s) => s.leagues);

  // A `league` param (from a league page) opens that league; a later tap overrides it.
  const [pick, setPick] = useState<{ from?: string; tab: Tab; league: string } | null>(null);
  const fromParam = params.league;
  const current = pick && pick.from === fromParam ? pick : null;
  const tab: Tab = current?.tab ?? (fromParam ? 'private' : 'global');
  const wanted = current?.league ?? fromParam ?? FRIENDS_LEAGUE_ID;
  const league = leagues.find((l) => l.id === wanted);
  const leagueId = league ? league.id : FRIENDS_LEAGUE_ID;
  const choose = (next: Partial<{ tab: Tab; league: string }>) =>
    setPick({ from: fromParam, tab: next.tab ?? tab, league: next.league ?? leagueId });

  const [period, setPeriod] = useState<Period>('week');
  const members = useMemo(
    () => (tab === 'global' ? BOTS : leagueMembers(leagueId, league?.extra)),
    [tab, leagueId, league?.extra],
  );
  const { board, today, now, you } = useBoard(members, period);
  const profile = useGame((s) => s.profile);
  const playedToday = useGame((s) => !!s.dailyHistory[today]);

  const crownId = useMemo(
    () => (tab === 'private' ? lastWeekBoard(members, today, you)[0]?.id : undefined),
    [tab, members, today, you],
  );

  const sponsor = weeklySponsor(today);
  const me = board.find((e) => e.isYou);
  const podium = board.slice(0, 3);
  const rest = board.slice(3);
  const leagueName = league ? league.name : t('ranks.friends');
  // A new board or period is a new list: the podium and the rows play their entrance again.
  const boardKey = `${tab}:${leagueId}:${period}`;

  const footer = (
    <View style={styles.pinned}>
      {me ? (
        <View style={{ gap: space.xs }}>
          <Row entry={me} prizeZone={tab === 'global' && period === 'week' && me.rank <= 3} crowned={me.id === crownId} pinned />
          {!profile && tab === 'global' && (
            <PressableScale onPress={() => router.push('/signup')} accessibilityRole="button" hitSlop={6}>
              <Txt variant="small" tone="primary" center style={{ fontWeight: '700' }}>
                {t('ranks.guestNote')}
              </Txt>
            </PressableScale>
          )}
        </View>
      ) : (
        <View style={styles.notOnBoard}>
          <Txt variant="small" tone="muted" style={{ flex: 1 }}>
            {t('ranks.notOnBoard')}
          </Txt>
          {!playedToday && <Button small label={t('home.dailyCta')} icon="play" onPress={() => router.push('/daily/play')} />}
        </View>
      )}
    </View>
  );

  return (
    <Screen tabBarInset footer={footer} contentStyle={styles.content}>
      <FadeInUp index={0} style={{ gap: space.md }}>
        <Txt variant="title">{t('ranks.title')}</Txt>
        <Segmented<Tab>
          value={tab}
          onChange={(v) => choose({ tab: v })}
          options={[
            { value: 'global', label: t('ranks.global') },
            { value: 'private', label: t('ranks.private') },
          ]}
        />
      </FadeInUp>

      {tab === 'global' ? (
        <PopIn key="prize" delay={80}>
          <HeroCard color={sponsor.color} onPress={() => router.push('/prizes')}>
            <View style={styles.prize}>
              <View style={[styles.prizeIcon, { backgroundColor: fixed.white }]}>
                <Icon name="trophy" size={26} color={sponsor.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="tiny" tone="onAccent" style={{ opacity: 0.85 }}>
                  {t('ranks.prizeBanner').toUpperCase()}
                </Txt>
                <Txt variant="heading" tone="onAccent">
                  {t('ranks.prizeTop', { amount: formatBirr(lang, PRIZE_AMOUNTS[0]) })}
                </Txt>
                <Txt variant="small" tone="onAccent" style={{ opacity: 0.9 }}>
                  {t('ranks.fundedEnds', { name: sponsor.name, time: formatSpan(lang, msUntilWeekEnd(now)) })}
                </Txt>
              </View>
              <Icon name="chevron-forward" color={colors.onAccent} />
            </View>
          </HeroCard>
        </PopIn>
      ) : (
        <FadeInUp key="leagues" index={1} style={{ gap: space.md }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.chips}
          >
            <Chip label={t('ranks.friends')} icon="people" active={leagueId === FRIENDS_LEAGUE_ID} onPress={() => choose({ league: FRIENDS_LEAGUE_ID })} />
            {leagues.map((l) => (
              <Chip key={l.id} label={l.name} icon="shield" active={leagueId === l.id} onPress={() => choose({ league: l.id })} />
            ))}
            <Chip label={t('league.new')} icon="add" dashed onPress={() => router.push('/league/new')} />
            <Chip label={t('league.join')} icon="enter-outline" dashed onPress={() => router.push('/league/join')} />
          </ScrollView>

          <Card style={styles.leagueCard}>
            <View style={[styles.leagueIcon, { backgroundColor: modeColors.duel }]}>
              <Icon name={league ? 'shield' : 'people'} size={22} color={colors.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {leagueName}
              </Txt>
              <Txt variant="small" tone="muted">
                {t('league.members', { n: members.length + 1 })}
              </Txt>
            </View>
            <Button
              small
              kind={league ? 'primary' : 'secondary'}
              icon={league ? 'person-add' : 'people'}
              label={league ? t('league.invite') : t('league.manage')}
              onPress={() => router.push({ pathname: '/league/[id]', params: { id: leagueId } })}
            />
          </Card>
        </FadeInUp>
      )}

      <FadeInUp index={2} style={{ gap: space.sm }}>
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: t('ranks.week') },
            { value: 'today', label: t('ranks.today') },
          ]}
        />
        <Txt variant="small" tone="muted">
          {tab === 'global' ? t('ranks.globalNote') : t('league.note')}
        </Txt>
      </FadeInUp>

      {board.length === 0 ? (
        <FadeInUp key={boardKey} style={styles.empty}>
          <Icon name="podium-outline" size={32} color={colors.textMuted} />
          <Txt tone="muted" center>
            {t('ranks.empty')}
          </Txt>
        </FadeInUp>
      ) : (
        <View key={boardKey} style={{ gap: space.sm }}>
          <View style={styles.podium}>
            {[1, 0, 2].map(
              (i) => podium[i] && <PodiumSpot key={podium[i].id} entry={podium[i]} place={i} crowned={podium[i].id === crownId} />,
            )}
          </View>
          {rest.map((e, i) => (
            <FadeInUp key={e.id} index={Math.min(i, MAX_STAGGER)} delay={RISE_GAP_MS * 2}>
              <Row entry={e} prizeZone={false} crowned={e.id === crownId} />
            </FadeInUp>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Chip({
  label,
  icon,
  active,
  dashed,
  onPress,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  dashed?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = active ? colors.onInk : colors.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.ink : dashed ? 'transparent' : colors.surface,
          borderColor: active ? colors.ink : colors.border,
          borderStyle: dashed ? 'dashed' : 'solid',
        },
      ]}
    >
      <Icon name={icon} size={16} color={active ? colors.onInk : colors.textMuted} />
      <Txt variant="small" numberOfLines={1} style={{ fontWeight: '700', color: fg, maxWidth: 140 }}>
        {label}
      </Txt>
    </PressableScale>
  );
}

function Crown() {
  const { t } = useT();
  return (
    <View accessibilityLabel={t('league.crown')}>
      <Icon name="ribbon" size={16} color={medals[0]} />
    </View>
  );
}

/** One podium column. Third place rises first, then second, then first. */
function PodiumSpot({ entry, place, crowned }: { entry: BoardEntry; place: number; crowned?: boolean }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [rise] = useState(() => new Animated.Value(0));
  const height = STEP_HEIGHT[place];

  useEffect(() => {
    if (reduced) {
      rise.setValue(1);
      return;
    }
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: duration.slow,
      delay: (2 - place) * RISE_GAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, rise, place]);

  // The step slides up from behind the baseline and carries the player with it.
  const lift = rise.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <View style={styles.spot}>
      <Animated.View
        style={[
          styles.rider,
          { opacity: rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: lift }] },
        ]}
      >
        <Avatar name={entry.name} size={place === 0 ? 60 : 48} color={entry.isYou ? colors.primaryStrong : undefined} />
        <View style={styles.spotName}>
          {crowned && <Crown />}
          <Txt variant="small" numberOfLines={1} style={{ fontWeight: '800', flexShrink: 1 }}>
            {entry.name}
          </Txt>
        </View>
        <Txt variant="small" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
          {entry.score}
        </Txt>
      </Animated.View>
      <View style={{ height, alignSelf: 'stretch', overflow: 'hidden' }}>
        <Animated.View
          style={[
            styles.step,
            {
              backgroundColor: entry.isYou ? colors.primarySoft : colors.surface,
              borderColor: colors.border,
              borderTopColor: medals[place],
              transform: [{ translateY: lift }],
            },
          ]}
        >
          <View style={[styles.medal, { backgroundColor: medals[place] }]}>
            <Txt variant="heading" style={{ color: fixed.ink, fontWeight: '800' }}>
              {entry.rank}
            </Txt>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function Row({ entry, prizeZone, pinned, crowned }: { entry: BoardEntry; prizeZone: boolean; pinned?: boolean; crowned?: boolean }) {
  const { colors, shadow } = useTheme();
  const { t } = useT();
  const score = useCountUp(entry.score);
  return (
    <View
      style={[
        styles.row,
        entry.isYou
          ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
          : [{ backgroundColor: colors.surface, borderColor: colors.border }, shadow.card],
        pinned && { paddingVertical: 6 },
      ]}
    >
      <Txt variant="bodyStrong" tone={entry.isYou ? 'primary' : 'text'} style={styles.rank}>
        {entry.rank}
      </Txt>
      <Avatar name={entry.name} color={entry.isYou ? colors.primaryStrong : undefined} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {entry.name}
            {entry.isYou && entry.name !== t('ranks.you') ? ` (${t('ranks.you')})` : ''}
          </Txt>
          {crowned && <Crown />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt variant="small" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {[entry.city, t('ranks.days', { n: entry.daysPlayed })].filter(Boolean).join(' · ')}
          </Txt>
          {prizeZone && (
            <View>
              <Badge label={t('ranks.prizeZone')} icon="trophy" bg={colors.goldSoft} fg={colors.gold} />
            </View>
          )}
        </View>
      </View>
      <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
        {score}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md },
  prize: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  prizeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bleed: { marginHorizontal: -space.lg },
  chips: { gap: space.sm, paddingVertical: 2, paddingHorizontal: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  leagueCard: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  leagueIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.sm, paddingTop: space.sm },
  spot: { flex: 1, alignItems: 'center', gap: 6 },
  rider: { alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  spotName: { flexDirection: 'row', alignItems: 'center', gap: 2, maxWidth: '100%' },
  step: {
    flex: 1,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopWidth: 4,
    alignItems: 'center',
    paddingTop: space.md,
  },
  medal: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rank: { width: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
  pinned: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  notOnBoard: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
});
