import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Brand } from '@/components/Brand';
import { Button, Card, Icon, IconButton, Pill, Screen, Txt, type IconName } from '@/components/ui';
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
  const coins = useGame((s) => s.coins);
  const streak = useGame((s) => s.streak);
  const record = useGame((s) => s.dailyHistory[today]);
  const progress = useGame((s) => s.dailyProgress);

  const streakNow = effectiveStreak(streak, today);
  const atRisk = streakAtRisk(streak, today) && !record;
  const inProgress = progress?.day === today ? progress.answers.length : 0;

  return (
    <Screen>
      <View style={styles.top}>
        <Brand size={24} />
        <View style={styles.pills}>
          <Pill icon="flame" label={String(streakNow)} color={colors.primary} bg={colors.primarySoft} />
          <Pill icon="ellipse" label={String(coins)} color={colors.gold} bg={colors.goldSoft} />
          <IconButton icon="settings-outline" label={t('settings.title')} onPress={() => router.push('/settings')} />
        </View>
      </View>

      <Txt variant="title">{profile ? t('home.greeting', { name: profile.name }) : t('home.greetingGuest')}</Txt>

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
      <ModeCard icon="mic" title={t('home.streetTitle')} body={t('home.streetBody')} soon={t('home.soon')} />
      <ModeCard icon="grid" title={t('home.topicsTitle')} body={t('home.topicsBody')} soon={t('home.soon')} />
    </Screen>
  );
}

function ModeCard({
  icon,
  title,
  body,
  soon,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  soon?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={[styles.mode, !onPress && { opacity: 0.7 }]}>
      <View style={[styles.modeIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" tone="muted">
          {body}
        </Txt>
        {!onPress && soon && (
          <Txt variant="tiny" tone="primary" style={{ marginTop: 4 }}>
            {soon.toUpperCase()}
          </Txt>
        )}
      </View>
      {onPress && <Icon name="chevron-forward" color={colors.textMuted} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
  daily: { borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  mode: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  modeIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
