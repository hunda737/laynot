import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, Icon, Screen, Txt, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/data/questions';
import { STREET_EPISODES } from '@/data/street';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT, type StringKey } from '@/i18n';
import { outcome } from '@/lib/duel';
import { effectiveStreak } from '@/lib/streak';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Profile() {
  const { colors } = useTheme();
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
  const playedTopics = CATEGORIES.filter((c) => topicStats[c.id]);
  const episodesPlayed = Object.keys(streetResults).length;

  return (
    <Screen>
      <View style={styles.head}>
        <Avatar name={profile?.name ?? '?'} size={64} color={colors.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{profile?.name ?? t('profile.guest')}</Txt>
          {profile && (
            <Txt variant="small" tone="muted">
              +251 {profile.phone} · {t('profile.member', { date: formatDay(lang, profile.joinedDay) })}
            </Txt>
          )}
        </View>
      </View>

      {!profile && (
        <LinkRow icon="shield-checkmark" title={t('profile.signupCta')} onPress={() => router.push('/signup')} accent />
      )}

      <View style={styles.stats}>
        <Stat icon="flame" color={colors.primary} value={effectiveStreak(streak, today)} label={t('profile.streak')} />
        <Stat icon="ribbon" color={colors.sponsor} value={streak.best} label={t('profile.best')} />
        <Stat icon="calendar" color={colors.success} value={days.length} label={t('profile.played')} />
        <Stat icon="ellipse" color={colors.gold} value={coins} label={t('profile.coins')} />
      </View>

      <Txt variant="heading">{t('home.dailyTitle')}</Txt>
      {days.length === 0 ? (
        <Card style={{ alignItems: 'center' }}>
          <Icon name="calendar-outline" size={32} color={colors.textMuted} />
          <Txt tone="muted" center>
            {t('profile.firstDaily')}
          </Txt>
          <Button small label={t('home.dailyCta')} icon="play" onPress={() => router.push('/daily/play')} />
        </Card>
      ) : (
        days.slice(0, 7).map((r) => (
          <Card
            key={r.day}
            style={styles.row}
            onPress={() => router.push({ pathname: '/daily/result', params: { day: r.day } })}
          >
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {formatDay(lang, r.day)}
            </Txt>
            <Txt variant="small" tone="muted">
              {r.correct}/{r.total}
            </Txt>
            <Txt variant="bodyStrong" style={{ minWidth: 56, textAlign: 'right' }}>
              {r.score}
            </Txt>
          </Card>
        ))
      )}

      {playedTopics.length > 0 && (
        <>
          <Txt variant="heading">{t('profile.topics')}</Txt>
          <Card>
            {playedTopics.map((c) => {
              const s = topicStats[c.id]!;
              const pct = Math.round((s.correct / Math.max(1, s.answered)) * 100);
              return (
                <View key={c.id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Icon name={c.icon as IconName} size={16} color={colors.primary} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {t(`cat.${c.id}` as StringKey)}
                    </Txt>
                    <Txt variant="small" tone="muted">
                      {t('profile.accuracy', { n: pct, rounds: s.rounds })}
                    </Txt>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.bar, { width: `${pct}%`, backgroundColor: colors.success }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <LinkRow
        icon="mic"
        title={t('profile.street')}
        body={t('profile.episodes', { n: episodesPlayed, total: STREET_EPISODES.length })}
        onPress={() => router.push('/street')}
      />
      <LinkRow
        icon="flash"
        title={t('duel.title')}
        body={t('duel.record', record)}
        onPress={() => router.push('/duels')}
      />
      <LinkRow
        icon="albums"
        title={t('flash.title')}
        body={
          flash.rounds > 0
            ? t('flash.stats', { n: Math.round((100 * flash.known) / Math.max(flash.seen, 1)), rounds: flash.rounds })
            : t('flash.tile')
        }
        onPress={() => router.push('/flashcards')}
      />
      {missedCount > 0 && (
        <LinkRow
          icon="refresh"
          title={t('review.title')}
          body={t('review.count', { n: missedCount })}
          onPress={() => router.push('/review')}
        />
      )}
      <LinkRow icon="trophy" title={t('profile.prizes')} onPress={() => router.push('/prizes')} />
      <LinkRow icon="settings-outline" title={t('profile.settings')} onPress={() => router.push('/settings')} />
    </Screen>
  );
}

function LinkRow({
  icon,
  title,
  body,
  onPress,
  accent,
}: {
  icon: IconName;
  title: string;
  body?: string;
  onPress: () => void;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={[styles.row, accent && { borderColor: colors.primary }]}>
      <Icon name={icon} color={accent ? colors.primary : colors.text} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {body && (
          <Txt variant="small" tone="muted">
            {body}
          </Txt>
        )}
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

function Stat({ icon, color, value, label }: { icon: IconName; color: string; value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name={icon} color={color} />
      <Txt variant="title">{value}</Txt>
      <Txt variant="small" tone="muted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: 2 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
