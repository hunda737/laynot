import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button, Icon, Segmented, Txt } from '@/components/ui';
import { PRIZE_AMOUNTS, weeklySponsor } from '@/data/prizes';
import { useBoard } from '@/hooks/useBoard';
import { formatBirr, formatSpan, useT, type StringKey } from '@/i18n';
import { msUntilWeekEnd } from '@/lib/clock';
import type { BoardEntry, Period, Scope } from '@/lib/leaderboard';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const MEDALS = ['#E2A400', '#9CA3AF', '#B87333'];

export default function Ranks() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const [scope, setScope] = useState<Scope>('global');
  const [period, setPeriod] = useState<Period>('week');
  const { board, today, now } = useBoard(scope, period);
  const profile = useGame((s) => s.profile);
  const playedToday = useGame((s) => !!s.dailyHistory[today]);

  const sponsor = weeklySponsor(today);
  const me = board.find((e) => e.isYou);
  const podium = board.slice(0, 3);
  const rest = board.slice(3);
  const notes: Record<Scope, StringKey> = { global: 'ranks.globalNote', friends: 'ranks.friendsNote', league: 'ranks.leagueNote' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt variant="title">{t('ranks.title')}</Txt>

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

        <Segmented<Scope>
          value={scope}
          onChange={setScope}
          options={[
            { value: 'global', label: t('ranks.global') },
            { value: 'friends', label: t('ranks.friends') },
            { value: 'league', label: t('ranks.league') },
          ]}
        />
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: t('ranks.week') },
            { value: 'today', label: t('ranks.today') },
          ]}
        />
        <Txt variant="small" tone="muted">
          {t(notes[scope])}
        </Txt>

        {board.length === 0 ? (
          <Txt tone="muted" center style={{ paddingVertical: space.xl }}>
            {t('ranks.empty')}
          </Txt>
        ) : (
          <>
            <View style={styles.podium}>
              {[1, 0, 2].map((i) => podium[i] && <PodiumSpot key={podium[i].id} entry={podium[i]} place={i} />)}
            </View>
            {rest.map((e) => (
              <Row key={e.id} entry={e} prizeZone={false} />
            ))}
          </>
        )}
      </ScrollView>

      <View style={[styles.pinned, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {me ? (
          <View style={{ gap: 4 }}>
            <Row entry={me} prizeZone={scope === 'global' && period === 'week' && me.rank <= 3} compact />
            {!profile && scope === 'global' && (
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

function PodiumSpot({ entry, place }: { entry: BoardEntry; place: number }) {
  const { colors } = useTheme();
  const heights = [96, 72, 56];
  return (
    <View style={styles.spot}>
      <Avatar name={entry.name} size={place === 0 ? 56 : 46} color={entry.isYou ? colors.primary : undefined} />
      <Txt variant="small" numberOfLines={1} style={{ fontWeight: '800', maxWidth: 100 }}>
        {entry.name}
      </Txt>
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

function Row({ entry, prizeZone, compact }: { entry: BoardEntry; prizeZone: boolean; compact?: boolean }) {
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
        <Txt variant="bodyStrong" numberOfLines={1}>
          {entry.name}
          {entry.isYou && entry.name !== t('ranks.you') ? ` (${t('ranks.you')})` : ''}
        </Txt>
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
