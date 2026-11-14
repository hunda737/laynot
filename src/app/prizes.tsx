import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Card, Header, Icon, Screen, Txt } from '@/components/ui';
import { PRIZE_AMOUNTS, weeklySponsor } from '@/data/prizes';
import { useYouInput } from '@/hooks/useBoard';
import { useNow } from '@/hooks/useNow';
import { formatBirr, formatSpan, useT, type StringKey } from '@/i18n';
import { dayKey, HOUR_MS, msUntilWeekEnd, parseDayKey, weekStart } from '@/lib/clock';
import { lastWeekWinners, MIN_DAYS_FOR_PRIZE, prizeEligibility } from '@/lib/leaderboard';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PLACES: StringKey[] = ['prizes.p1', 'prizes.p2', 'prizes.p3'];

export default function Prizes() {
  const { colors } = useTheme();
  const { t, lang } = useT();
  const now = useNow(30_000);
  const today = dayKey(now);
  const you = useYouInput();
  const profile = useGame((s) => s.profile);

  const sponsor = weeklySponsor(today);
  const elig = prizeEligibility(profile, you.scores, today);
  const winners = lastWeekWinners(today, you);
  const inReview = now - parseDayKey(weekStart(today)).getTime() < 48 * HOUR_MS;

  const checks: [boolean, string][] = [
    [elig.signedUp, t('prizes.eligSignup')],
    [elig.adult, t('prizes.eligAdult')],
    [elig.enoughDays, t('prizes.eligDays', { min: MIN_DAYS_FOR_PRIZE, n: elig.daysPlayed })],
  ];

  return (
    <Screen>
      <Header title={t('prizes.title')} onBack={goBack} />

      <View style={[styles.hero, { backgroundColor: sponsor.color }]}>
        <View style={styles.logo}>
          <Icon name={sponsor.icon} size={30} color={sponsor.color} />
        </View>
        <Txt variant="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
          {t('prizes.fundedBy', { name: sponsor.name })}
        </Txt>
        <View style={styles.amounts}>
          {PRIZE_AMOUNTS.map((amount, i) => (
            <View key={i} style={[styles.amount, i === 0 && { transform: [{ scale: 1.08 }] }]}>
              <Txt variant="tiny" style={{ color: sponsor.color }}>
                {t(PLACES[i])}
              </Txt>
              <Txt variant="heading" style={{ color: '#17150F' }}>
                {amount.toLocaleString('en-US')}
              </Txt>
              <Txt variant="tiny" style={{ color: '#6A655B' }}>
                {lang === 'am' ? 'ብር' : 'BIRR'}
              </Txt>
            </View>
          ))}
        </View>
        <Txt variant="small" style={{ color: '#FFFFFF', opacity: 0.9 }}>
          {t('prizes.endsIn', { time: formatSpan(lang, msUntilWeekEnd(now)) })}
        </Txt>
      </View>

      <Card>
        <Txt variant="heading">{t('prizes.howTitle')}</Txt>
        {(['prizes.how1', 'prizes.how2', 'prizes.how3'] as StringKey[]).map((k, i) => (
          <View key={k} style={styles.step}>
            <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
              <Txt variant="small" tone="primary" style={{ fontWeight: '800' }}>
                {i + 1}
              </Txt>
            </View>
            <Txt style={{ flex: 1 }}>{t(k)}</Txt>
          </View>
        ))}
      </Card>

      <Card style={{ borderColor: elig.eligible ? colors.success : colors.border }}>
        <View style={styles.step}>
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('prizes.eligTitle')}
          </Txt>
          <Txt variant="small" tone={elig.eligible ? 'success' : 'muted'} style={{ fontWeight: '800' }}>
            {elig.eligible ? t('prizes.eligible') : t('prizes.notEligible')}
          </Txt>
        </View>
        {checks.map(([ok, label]) => (
          <View key={label} style={styles.step}>
            <Icon name={ok ? 'checkmark-circle' : 'ellipse-outline'} color={ok ? colors.success : colors.textMuted} />
            <Txt style={{ flex: 1 }} tone={ok ? 'text' : 'muted'}>
              {label}
            </Txt>
          </View>
        ))}
        {!elig.signedUp && <Button label={t('result.signupCta')} onPress={() => router.push('/signup')} />}
      </Card>

      <Card>
        <Txt variant="heading">{t('prizes.lastWeek')}</Txt>
        {winners.map((w, i) => (
          <View key={w.id} style={styles.step}>
            <Avatar name={w.name} color={w.isYou ? colors.primary : undefined} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">
                {t(PLACES[i])} · {w.name}
              </Txt>
              <Txt variant="small" tone="muted">
                {w.score} · {formatBirr(lang, PRIZE_AMOUNTS[i])}
              </Txt>
            </View>
            <Txt variant="small" tone={inReview ? 'gold' : 'success'} style={{ fontWeight: '800' }}>
              {inReview ? t('prizes.inReview') : t('prizes.paid')}
            </Txt>
          </View>
        ))}
      </Card>

      <Card>
        <Txt variant="heading">{t('prizes.rulesTitle')}</Txt>
        {(['prizes.r1', 'prizes.r2', 'prizes.r3', 'prizes.r4', 'prizes.r5', 'prizes.r6'] as StringKey[]).map((k) => (
          <View key={k} style={[styles.step, { alignItems: 'flex-start' }]}>
            <Txt tone="muted">•</Txt>
            <Txt variant="small" style={{ flex: 1, lineHeight: 19 }}>
              {t(k)}
            </Txt>
          </View>
        ))}
        <Txt variant="small" tone="danger" style={{ fontWeight: '700' }}>
          {t('prizes.legal')}
        </Txt>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.md },
  logo: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  amounts: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch' },
  amount: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', gap: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
