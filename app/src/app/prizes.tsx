import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { Badge, Button, Card, HeroCard, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { PRIZE_AMOUNTS, weeklySponsor } from '@/data/prizes';
import { useYouInput } from '@/hooks/useBoard';
import { useNow } from '@/hooks/useNow';
import { formatBirr, formatSpan, useT, type StringKey } from '@/i18n';
import { dayKey, HOUR_MS, msUntilWeekEnd, parseDayKey, weekStart } from '@/lib/clock';
import { lastWeekWinners, MIN_DAYS_FOR_PRIZE, prizeEligibility } from '@/lib/leaderboard';
import { useGame } from '@/store/useGameStore';
import { useReducedMotion } from '@/theme/motion';
import { fixed, radius, space } from '@/theme/tokens';
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
      <TopBar title={t('prizes.title')} />

      <PopIn>
        <HeroCard color={sponsor.color} align="center" pattern="rings">
          <View style={[styles.logo, { backgroundColor: fixed.white }]}>
            <Icon name={sponsor.icon} size={30} color={sponsor.color} />
          </View>
          <Txt variant="small" tone="onAccent" center style={{ fontWeight: '700' }}>
            {t('prizes.fundedBy', { name: sponsor.name })}
          </Txt>
          <View style={styles.amounts}>
            {PRIZE_AMOUNTS.map((amount, i) => (
              <PopIn key={i} index={i} delay={160} style={{ flex: 1 }}>
                <View style={[styles.amount, { backgroundColor: fixed.white }, i === 0 && { transform: [{ scale: 1.08 }] }]}>
                  <Txt variant="tiny" style={{ color: sponsor.color }}>
                    {t(PLACES[i])}
                  </Txt>
                  <PrizeAmount amount={amount} />
                  <Txt variant="tiny" style={{ color: fixed.inkMuted }}>
                    {lang === 'am' ? 'ብር' : 'BIRR'}
                  </Txt>
                </View>
              </PopIn>
            ))}
          </View>
          <Txt variant="small" tone="onAccent" center style={{ opacity: 0.9 }}>
            {t('prizes.endsIn', { time: formatSpan(lang, msUntilWeekEnd(now)) })}
          </Txt>
        </HeroCard>
      </PopIn>

      <FadeInUp index={1}>
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
      </FadeInUp>

      <FadeInUp index={2}>
        <Card style={{ borderColor: elig.eligible ? colors.success : colors.border }}>
          <View style={styles.step}>
            <Txt variant="heading" style={{ flex: 1 }}>
              {t('prizes.eligTitle')}
            </Txt>
            <View>
              <Badge
                label={elig.eligible ? t('prizes.eligible') : t('prizes.notEligible')}
                bg={elig.eligible ? colors.successSoft : colors.surfaceAlt}
                fg={elig.eligible ? colors.success : colors.textMuted}
              />
            </View>
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
      </FadeInUp>

      <FadeInUp index={3}>
        <Card>
          <Txt variant="heading">{t('prizes.lastWeek')}</Txt>
          {winners.map((w, i) => (
            <View key={w.id} style={styles.step}>
              <Avatar name={w.name} color={w.isYou ? colors.primaryStrong : undefined} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">
                  {t(PLACES[i])} · {w.name}
                </Txt>
                <Txt variant="small" tone="muted">
                  {w.score} · {formatBirr(lang, PRIZE_AMOUNTS[i])}
                </Txt>
              </View>
              <View>
                <Badge
                  label={inReview ? t('prizes.inReview') : t('prizes.paid')}
                  bg={inReview ? colors.goldSoft : colors.successSoft}
                  fg={inReview ? colors.gold : colors.success}
                />
              </View>
            </View>
          ))}
        </Card>
      </FadeInUp>

      <FadeInUp index={4}>
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
      </FadeInUp>
    </Screen>
  );
}

/** A prize amount on its white tile. Counts up from zero the first time it shows. */
function PrizeAmount({ amount }: { amount: number }) {
  const reduced = useReducedMotion();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const shown = useCountUp(armed || reduced ? amount : 0);
  return (
    <Txt variant="heading" numberOfLines={1} adjustsFontSizeToFit style={{ color: fixed.ink, fontVariant: ['tabular-nums'] }}>
      {shown.toLocaleString('en-US')}
    </Txt>
  );
}

const styles = StyleSheet.create({
  logo: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  amounts: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch', marginVertical: space.sm },
  amount: { borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', gap: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
