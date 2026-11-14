import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button, Icon, Segmented, Txt } from '@/components/ui';
import { BOTS } from '@/data/players';
import { PRIZE_AMOUNTS, weeklySponsor } from '@/data/prizes';
import { useBoard } from '@/hooks/useBoard';
import { formatBirr, formatSpan, useT } from '@/i18n';
import { msUntilWeekEnd } from '@/lib/clock';
import { lastWeekBoard, type BoardEntry, type Period } from '@/lib/leaderboard';
import { FRIENDS_LEAGUE_ID, leagueMembers } from '@/lib/league';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const MEDALS = ['#E2A400', '#9CA3AF', '#B87333'];

type Tab = 'global' | 'private';

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt variant="title">{t('ranks.title')}</Txt>

        <Segmented<Tab>
          value={tab}
          onChange={(v) => choose({ tab: v })}
          options={[
            { value: 'global', label: t('ranks.global') },
            { value: 'private', label: t('ranks.private') },
          ]}
        />

        {tab === 'global' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/prizes')}
            style={({ pressed }) => [styles.prize, { backgroundColor: sponsor.color, opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.prizeIcon}>
              <Icon name="trophy" size={26} color={sponsor.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="tiny" style={{ color: '#FFFFFF', opacity: 0.85 }}>
                {t('ranks.prizeBanner').toUpperCase()}
              </Txt>
              <Txt variant="heading" style={{ color: '#FFFFFF' }}>
                {t('ranks.prizeTop', { amount: formatBirr(lang, PRIZE_AMOUNTS[0]) })}
              </Txt>
              <Txt variant="small" style={{ color: '#FFFFFF', opacity: 0.9 }}>
                {t('ranks.fundedEnds', { name: sponsor.name, time: formatSpan(lang, msUntilWeekEnd(now)) })}
              </Txt>
            </View>
            <Icon name="chevron-forward" color="#FFFFFF" />
          </Pressable>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label={t('ranks.friends')} icon="people" active={leagueId === FRIENDS_LEAGUE_ID} onPress={() => choose({ league: FRIENDS_LEAGUE_ID })} />
              {leagues.map((l) => (
                <Chip key={l.id} label={l.name} icon="shield" active={leagueId === l.id} onPress={() => choose({ league: l.id })} />
              ))}
              <Chip label={t('league.new')} icon="add" dashed onPress={() => router.push('/league/new')} />
              <Chip label={t('league.join')} icon="enter-outline" dashed onPress={() => router.push('/league/join')} />
            </ScrollView>

            <View style={[styles.leagueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.leagueIcon, { backgroundColor: colors.sponsorSoft }]}>
                <Icon name={league ? 'shield' : 'people'} size={22} color={colors.sponsor} />
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
            </View>
          </>
        )}

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

        {board.length === 0 ? (
          <Txt tone="muted" center style={{ paddingVertical: space.xl }}>
            {t('ranks.empty')}
          </Txt>
        ) : (
          <>
            <View style={styles.podium}>
              {[1, 0, 2].map(
                (i) => podium[i] && <PodiumSpot key={podium[i].id} entry={podium[i]} place={i} crowned={podium[i].id === crownId} />,
              )}
            </View>
            {rest.map((e) => (
              <Row key={e.id} entry={e} prizeZone={false} crowned={e.id === crownId} />
            ))}
          </>
        )}
      </ScrollView>

      <View style={[styles.pinned, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {me ? (
          <View style={{ gap: 4 }}>
            <Row entry={me} prizeZone={tab === 'global' && period === 'week' && me.rank <= 3} crowned={me.id === crownId} compact />
            {!profile && tab === 'global' && (
              <Pressable onPress={() => router.push('/signup')}>
                <Txt variant="small" tone="primary" center style={{ fontWeight: '700' }}>
                  {t('ranks.guestNote')}
                </Txt>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Txt variant="small" tone="muted" style={{ flex: 1 }}>
              {t('ranks.notOnBoard')}
            </Txt>
            {!playedToday && <Button small label={t('home.dailyCta')} icon="play" onPress={() => router.push('/daily/play')} />}
          </View>
        )}
      </View>
    </SafeAreaView>
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
  icon: 'people' | 'shield' | 'add' | 'enter-outline';
  active?: boolean;
  dashed?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const activeFg = '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.sponsorStrong : colors.surface,
          borderColor: active ? colors.sponsorStrong : colors.border,
          borderStyle: dashed ? 'dashed' : 'solid',
        },
      ]}
    >
      <Icon name={icon} size={16} color={active ? activeFg : colors.textMuted} />
      <Txt variant="small" numberOfLines={1} style={{ fontWeight: '700', color: active ? activeFg : colors.text, maxWidth: 140 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function Crown() {
  const { t } = useT();
  return (
    <View accessibilityLabel={t('league.crown')}>
      <Icon name="ribbon" size={16} color={MEDALS[0]} />
    </View>
  );
}

function PodiumSpot({ entry, place, crowned }: { entry: BoardEntry; place: number; crowned?: boolean }) {
  const { colors } = useTheme();
  const heights = [96, 72, 56];
  return (
    <View style={styles.spot}>
      <Avatar name={entry.name} size={place === 0 ? 56 : 46} color={entry.isYou ? colors.primary : undefined} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {crowned && <Crown />}
        <Txt variant="small" numberOfLines={1} style={{ fontWeight: '800', maxWidth: 100 }}>
          {entry.name}
        </Txt>
      </View>
      <Txt variant="small" tone="muted">
        {entry.score}
      </Txt>
      <View
        style={[
          styles.step,
          { height: heights[place], backgroundColor: entry.isYou ? colors.primary : colors.surfaceAlt, borderColor: MEDALS[place] },
        ]}
      >
        <Txt variant="title" style={{ color: entry.isYou ? colors.onPrimary : MEDALS[place] }}>
          {entry.rank}
        </Txt>
      </View>
    </View>
  );
}

function Row({ entry, prizeZone, compact, crowned }: { entry: BoardEntry; prizeZone: boolean; compact?: boolean; crowned?: boolean }) {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <View
      style={[
        styles.row,
        compact && { paddingVertical: space.xs },
        entry.isYou && !compact && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        !entry.isYou && { borderColor: colors.border, backgroundColor: colors.surface },
        compact && { backgroundColor: 'transparent', borderColor: 'transparent' },
      ]}
    >
      <Txt variant="bodyStrong" style={styles.rank}>
        {entry.rank}
      </Txt>
      <Avatar name={entry.name} color={entry.isYou ? colors.primary : undefined} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {entry.name}
            {entry.isYou && entry.name !== t('ranks.you') ? ` (${t('ranks.you')})` : ''}
          </Txt>
          {crowned && <Crown />}
        </View>
        <Txt variant="small" tone="muted" numberOfLines={1}>
          {[entry.city, t('ranks.days', { n: entry.daysPlayed })].filter(Boolean).join(' · ')}
          {prizeZone ? ` · ${t('ranks.prizeZone')}` : ''}
        </Txt>
      </View>
      <Txt variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
        {entry.score}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  prize: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  prizeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  chips: { gap: space.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  leagueCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, borderWidth: 1 },
  leagueIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.sm, paddingTop: space.md },
  spot: { flex: 1, alignItems: 'center', gap: 4 },
  step: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderTopWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  pinned: { borderTopWidth: 1, paddingHorizontal: space.lg, paddingVertical: space.sm },
});
