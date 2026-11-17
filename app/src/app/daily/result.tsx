import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AdBanner } from '@/components/AdBanner';
import { DifficultyBadge } from '@/components/difficulty';
import { Confetti, FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { CoinChip } from '@/components/status';
import { Badge, Button, Card, HeroCard, Icon, Screen, SectionHeader, TopBar, Txt } from '@/components/ui';
import { useBoard } from '@/hooks/useBoard';
import { useNow } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
import { questionById } from '@/data';
import { BOTS } from '@/data/players';
import { dailyNumber, dayKey, formatCountdown, msUntilNextDay } from '@/lib/clock';
import { shareGrid, type AnswerMark } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { fixed, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** A result counts as strong, and earns confetti, from this share of right answers. */
const STRONG_SHARE = 0.7;

/** Review cards past this one arrive together, so a long list does not keep the reader waiting. */
const MAX_STAGGER = 10;

export default function DailyResult() {
  const { colors } = useTheme();
  const { t, L, lang } = useT();
  const params = useLocalSearchParams<{ day?: string }>();
  const now = useNow();
  const today = dayKey(now);
  const day = params.day ?? today;

  const record = useGame((s) => s.dailyHistory[day]);
  const profile = useGame((s) => s.profile);
  const promptDismissed = useGame((s) => s.signupPromptDismissed);
  const dismissPrompt = useGame((s) => s.dismissSignupPrompt);
  const { board } = useBoard(BOTS, 'today');
  const me = board.find((e) => e.isYou);

  // The score starts at zero and counts up once the screen is on.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const score = useCountUp(shown ? (record?.score ?? 0) : 0, 900);

  if (!record) return <Redirect href="/home" />;

  const marks = record.answers.map((a) => a.mark);
  const isToday = day === today;
  const showSignup = isToday && !profile && !promptDismissed;
  const strong = record.total > 0 && record.correct / record.total >= STRONG_SHARE;

  const share = async () => {
    haptic.tap();
    const message = t('result.shareText', {
      n: dailyNumber(day),
      score: record.score,
      streak: record.streakAfter,
      grid: shareGrid(marks),
    });
    try {
      await Share.share({ message });
    } catch {
      // Sharing is unavailable on some desktop browsers; nothing else to do in the demo.
    }
  };

  const goHome = () => (params.day && router.canGoBack() ? router.back() : router.dismissTo('/home'));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar left="close" onLeft={goHome} title={t('result.title', { n: dailyNumber(day) })} subtitle={formatDay(lang, day)} />

      <PopIn>
        <HeroCard color={colors.primaryStrong} align="center" watermark={strong ? 'trophy' : undefined}>
          <Txt
            variant="number"
            tone="onAccent"
            style={styles.score}
            accessibilityLabel={`${record.score} ${t('result.points')}`}
          >
            {score}
          </Txt>
          <Txt variant="bodyStrong" tone="onAccent" center style={{ opacity: 0.92 }}>
            {t('result.points')} · {t('result.correctOf', { n: record.correct, total: record.total })}
          </Txt>
          <MarkGrid marks={marks} />
          <View style={styles.pills}>
            <View style={[styles.streak, { backgroundColor: colors.onAccent }]}>
              <Badge
                icon="flame"
                label={t('result.streak', { n: record.streakAfter })}
                bg={colors.onAccent}
                fg={colors.primaryStrong}
              />
            </View>
            <CoinChip amount={record.coins} prefix="+" variant="onColor" />
          </View>
        </HeroCard>
      </PopIn>

      <FadeInUp index={1}>
        <Button label={t('result.share')} icon="share-social" onPress={share} />
      </FadeInUp>

      {isToday && me && board.length >= 3 && (
        <FadeInUp index={2}>
          <Card style={styles.rankRow} onPress={() => router.navigate('/ranks')}>
            <View style={[styles.rankIcon, { backgroundColor: colors.goldSoft }]}>
              <Icon name="podium" size={18} color={colors.gold} />
            </View>
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {t('result.rank', { rank: me.rank, total: board.length })}
            </Txt>
            <Icon name="chevron-forward" color={colors.textMuted} />
          </Card>
        </FadeInUp>
      )}

      {isToday && (
        <FadeInUp index={3}>
          <Txt variant="small" tone="muted" center style={{ fontVariant: ['tabular-nums'] }}>
            {t('result.nextIn', { time: formatCountdown(msUntilNextDay(now)) })}
          </Txt>
        </FadeInUp>
      )}

      {showSignup && (
        <FadeInUp index={4}>
          <Card style={{ borderColor: colors.primary }}>
            <View style={styles.signupTop}>
              <View style={[styles.rankIcon, { backgroundColor: colors.primarySoft }]}>
                <Icon name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <Txt variant="heading" style={{ flex: 1 }}>
                {t('result.signupTitle')}
              </Txt>
            </View>
            <Txt tone="muted">{t('result.signupBody')}</Txt>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Button label={t('result.signupLater')} kind="secondary" onPress={dismissPrompt} style={{ flex: 1 }} />
              <Button label={t('result.signupCta')} onPress={() => router.push('/signup')} style={{ flex: 1 }} />
            </View>
          </Card>
        </FadeInUp>
      )}

      <AdBanner placement="result" />

      <FadeInUp index={5}>
        <SectionHeader title={t('result.review')} />
      </FadeInUp>
      {record.answers.map((a, i) => {
        const q = questionById(a.questionId);
        if (!q) return null;
        const good = a.mark === 'correct';
        return (
          <FadeInUp key={a.questionId} index={Math.min(i + 6, MAX_STAGGER)}>
            <Card style={{ gap: space.sm }}>
              <View style={styles.reviewTop}>
                <Icon
                  name={good ? 'checkmark-circle' : a.mark === 'timeout' ? 'time' : 'close-circle'}
                  size={22}
                  color={good ? colors.success : colors.danger}
                />
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {i + 1}. {L(q.text)}
                </Txt>
              </View>
              <DifficultyBadge level={q.difficulty} />
              <Txt tone="success" variant="small" style={{ fontWeight: '700' }}>
                ✓ {L(q.choices[0])}
              </Txt>
              {!good && (
                <Txt tone="danger" variant="small">
                  {a.pick === null ? t('result.noAnswer') : t('result.yourAnswer', { answer: L(q.choices[a.pick]) })}
                </Txt>
              )}
              <Txt variant="small" tone="muted">
                {L(q.fact)}
              </Txt>
            </Card>
          </FadeInUp>
        );
      })}

      <Button label={t('result.home')} kind="secondary" icon="home" onPress={goHome} />

      <Confetti fire={isToday && strong} />
    </Screen>
  );
}

/**
 * Result squares drawn on the red score card, so each mark needs its own shape, not only a colour:
 * a white tile with a tick, a darkened tile with a cross, a faint tile with a clock.
 */
function MarkGrid({ marks }: { marks: AnswerMark[] }) {
  const { colors } = useTheme();
  const look: Record<AnswerMark, { bg: string; shade?: boolean; icon: 'checkmark' | 'close' | 'time-outline'; fg: string }> = {
    correct: { bg: fixed.white, icon: 'checkmark', fg: colors.successStrong },
    wrong: { bg: 'transparent', shade: true, icon: 'close', fg: colors.onAccent },
    timeout: { bg: 'rgba(255,255,255,0.22)', icon: 'time-outline', fg: colors.onAccent },
  };
  return (
    <View style={styles.grid}>
      {marks.map((m, i) => (
        <PopIn key={i} index={i} delay={220}>
          <View style={[styles.cell, { backgroundColor: look[m].bg }]}>
            {look[m].shade && <View style={[StyleSheet.absoluteFill, styles.shade, { backgroundColor: fixed.ink }]} />}
            <Icon name={look[m].icon} size={16} color={look[m].fg} />
          </View>
        </PopIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  score: { fontSize: 60, lineHeight: 66, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 5 * 34, marginVertical: space.sm },
  cell: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shade: { opacity: 0.3 },
  pills: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  streak: { borderRadius: radius.pill, padding: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rankIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  signupTop: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  reviewTop: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
});
