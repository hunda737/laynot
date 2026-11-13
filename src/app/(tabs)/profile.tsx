import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, Screen, Txt, type IconName } from '@/components/ui';
import { useToday } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
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

  const days = Object.values(history).sort((a, b) => b.day.localeCompare(a.day));

  return (
    <Screen>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Txt variant="title" tone="onPrimary">
            {(profile?.name ?? '?').slice(0, 1).toUpperCase()}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{profile?.name ?? t('profile.guest')}</Txt>
          {profile ? (
            <Txt variant="small" tone="muted">
              +251 {profile.phone} · {t('profile.member', { date: formatDay(lang, profile.joinedDay) })}
            </Txt>
          ) : null}
        </View>
      </View>

      {!profile && (
        <Card onPress={() => router.push('/signup')} style={[styles.row, { borderColor: colors.primary }]}>
          <Icon name="shield-checkmark" color={colors.primary} />
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            {t('profile.signupCta')}
          </Txt>
          <Icon name="chevron-forward" color={colors.textMuted} />
        </Card>
      )}

      <View style={styles.stats}>
        <Stat icon="flame" color={colors.primary} value={effectiveStreak(streak, today)} label={t('profile.streak')} />
        <Stat icon="ribbon" color={colors.sponsor} value={streak.best} label={t('profile.best')} />
        <Stat icon="calendar" color={colors.success} value={days.length} label={t('profile.played')} />
        <Stat icon="ellipse" color={colors.gold} value={coins} label={t('profile.coins')} />
      </View>

      {days.length > 0 && <Txt variant="heading">{t('home.dailyTitle')}</Txt>}
      {days.slice(0, 14).map((r) => (
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
      ))}

      <Card onPress={() => router.push('/settings')} style={styles.row}>
        <Icon name="settings-outline" />
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {t('profile.settings')}
        </Txt>
        <Icon name="chevron-forward" color={colors.textMuted} />
      </Card>
    </Screen>
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
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
    gap: 2,
  },
});
