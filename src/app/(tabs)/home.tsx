import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Brand } from '@/components/Brand';
import { CoinsPill, LivesPill } from '@/components/status';
import { Button, Card, Icon, IconButton, Pill, Screen, Txt, type IconName } from '@/components/ui';
import { useDuels } from '@/hooks/useDuels';
import { useNow } from '@/hooks/useNow';
import { useT } from '@/i18n';
import { dayKey, formatCountdown, msUntilNextDay } from '@/lib/clock';
import { effectiveStreak, streakAtRisk } from '@/lib/streak';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function Home() {
  const { colors } = useTheme();
  const { t } = useT();
  const now = useNow();
  const today = dayKey(now);

  const profile = useGame((s) => s.profile);
  const streak = useGame((s) => s.streak);
  const record = useGame((s) => s.dailyHistory[today]);
  const progress = useGame((s) => s.dailyProgress);

  const streakNow = effectiveStreak(streak, today);
  const atRisk = streakAtRisk(streak, today) && !record;
  const inProgress = progress?.day === today ? progress.answers.length : 0;
  const { yourTurn } = useDuels(30_000);

  return (
    <Screen>
      <View style={styles.top}>
        <Brand size={24} />
        <IconButton icon="settings-outline" label={t('settings.title')} onPress={() => router.push('/settings')} />
      </View>

      <View style={{ gap: space.sm }}>
        <Txt variant="title">{profile ? t('home.greeting', { name: profile.name }) : t('home.greetingGuest')}</Txt>
        <View style={styles.pills}>
          <Pill icon="flame" label={String(streakNow)} color={colors.primary} bg={colors.primarySoft} />
          <LivesPill onPress={() => router.push('/topics')} />
          <CoinsPill />
        </View>
      </View>

      {atRisk && (
        <View style={[styles.banner, { backgroundColor: colors.goldSoft }]}>
          <Icon name="flame" color={colors.gold} />
          <Txt variant="small" style={{ flex: 1, fontWeight: '700' }}>
            {t('home.atRisk', { n: streak.current })}
          </Txt>
        </View>
      )}

      <View style={[styles.daily, { backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="calendar" color={colors.onPrimary} />
          <Txt variant="tiny" tone="onPrimary">
            {t('home.dailyTitle').toUpperCase()}
          </Txt>
        </View>
        {record ? (
          <>
            <Txt variant="small" tone="onPrimary" style={{ opacity: 0.85 }}>
              {t('home.dailyPlayed')}
            </Txt>
            <Txt variant="number" tone="onPrimary">
              {record.score}{' '}
              <Txt variant="heading" tone="onPrimary">
                {t('common.pts')}
              </Txt>
            </Txt>
            <Txt variant="small" tone="onPrimary" style={{ opacity: 0.85 }}>
              {t('home.dailyNext', { time: formatCountdown(msUntilNextDay(now)) })}
            </Txt>
            <Button label={t('home.dailySee')} kind="inverse" onPress={() => router.push('/daily/result')} />
          </>
        ) : (
          <>
            <Txt variant="title" tone="onPrimary">
              {t('app.tagline')}
            </Txt>
            <Txt variant="small" tone="onPrimary" style={{ opacity: 0.85 }}>
              {t('home.dailySubtitle')}
            </Txt>
            <Button
              label={inProgress > 0 ? t('home.dailyResume', { n: inProgress }) : t('home.dailyCta')}
              kind="inverse"
              icon="play"
              onPress={() => router.push('/daily/play')}
            />
          </>
        )}
      </View>

      <Txt variant="heading">{t('home.modes')}</Txt>
      <ModeCard icon="mic" title={t('home.streetTitle')} body={t('home.streetBody')} onPress={() => router.push('/street')} />
      <ModeCard icon="grid" title={t('home.topicsTitle')} body={t('home.topicsBody')} onPress={() => router.push('/topics')} />

      <Txt variant="heading">{t('home.friendsTitle')}</Txt>
      <ModeCard
        icon="flash"
        title={t('duel.title')}
        body={t('duel.home')}
        badge={yourTurn > 0 ? t('duel.yourTurnCount', { n: yourTurn }) : undefined}
        onPress={() => router.push('/duels')}
      />
      <ModeCard icon="people" title={t('live.title')} body={t('live.home')} onPress={() => router.push('/live')} />
    </Screen>
  );
}

function ModeCard({
  icon,
  title,
  body,
  badge,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  badge?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={styles.mode}>
      <View style={[styles.modeIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <Txt variant="bodyStrong">{title}</Txt>
          {badge && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Txt variant="tiny" tone="onPrimary">
                {badge}
              </Txt>
            </View>
          )}
        </View>
        <Txt variant="small" tone="muted">
          {body}
        </Txt>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
  daily: { borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  mode: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  modeIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
