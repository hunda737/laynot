import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, IconButton, Pill, Screen, Txt } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import { formatDay, useT } from '@/i18n';
import { questionById } from '@/data';
import { dailyNumber, dayKey, formatCountdown, msUntilNextDay } from '@/lib/clock';
import { shareGrid, type AnswerMark } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

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

  if (!record) return <Redirect href="/home" />;

  const marks = record.answers.map((a) => a.mark);
  const isToday = day === today;
  const showSignup = isToday && !profile && !promptDismissed;

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
      <View style={styles.top}>
        <IconButton icon="close" onPress={goHome} label={t('common.close')} />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{t('result.title', { n: dailyNumber(day) })}</Txt>
          <Txt variant="small" tone="muted">
            {formatDay(lang, day)}
          </Txt>
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Txt variant="number" tone="onPrimary" style={{ fontSize: 56 }}>
          {record.score}
        </Txt>
        <Txt variant="bodyStrong" tone="onPrimary" style={{ opacity: 0.9 }}>
          {t('result.points')} · {t('result.correctOf', { n: record.correct, total: record.total })}
        </Txt>
        <MarkGrid marks={marks} />
        <View style={styles.pills}>
          <Pill icon="flame" label={t('result.streak', { n: record.streakAfter })} color={colors.primary} bg={colors.onPrimary} />
          <Pill icon="ellipse" label={t('result.coins', { n: record.coins })} color={colors.gold} bg={colors.onPrimary} />
        </View>
      </View>

      <Button label={t('result.share')} icon="share-social" onPress={share} />

      {isToday && (
        <Txt variant="small" tone="muted" center>
          {t('result.nextIn', { time: formatCountdown(msUntilNextDay(now)) })}
        </Txt>
      )}

      {showSignup && (
        <Card style={{ borderColor: colors.primary }}>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Icon name="shield-checkmark" size={26} color={colors.primary} />
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
      )}

      <Txt variant="heading">{t('result.review')}</Txt>
      {record.answers.map((a, i) => {
        const q = questionById(a.questionId);
        if (!q) return null;
        const good = a.mark === 'correct';
        return (
          <Card key={a.questionId} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
              <Icon
                name={good ? 'checkmark-circle' : a.mark === 'timeout' ? 'time' : 'close-circle'}
                size={22}
                color={good ? colors.success : colors.danger}
              />
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {i + 1}. {L(q.text)}
              </Txt>
            </View>
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
        );
      })}

      <Button label={t('result.home')} kind="secondary" icon="home" onPress={goHome} />
    </Screen>
  );
}

/** Result squares drawn on the red score card, so each mark needs its own shape, not only a colour. */
function MarkGrid({ marks }: { marks: AnswerMark[] }) {
  const { colors } = useTheme();
  const look: Record<AnswerMark, { bg: string; icon: 'checkmark' | 'close' | 'time-outline'; fg: string }> = {
    correct: { bg: colors.onPrimary, icon: 'checkmark', fg: colors.success },
    wrong: { bg: 'rgba(0,0,0,0.28)', icon: 'close', fg: colors.onPrimary },
    timeout: { bg: 'rgba(255,255,255,0.22)', icon: 'time-outline', fg: colors.onPrimary },
  };
  return (
    <View style={styles.grid}>
      {marks.map((m, i) => (
        <View key={i} style={[styles.cell, { backgroundColor: look[m].bg }]}>
          <Icon name={look[m].icon} size={16} color={look[m].fg} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hero: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 5 * 34 },
  cell: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
