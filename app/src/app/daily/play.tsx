import { Redirect, router, usePreventRemove, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuizAd } from '@/components/AdBanner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pop } from '@/components/motion';
import { AnswerReveal, ProgressDots, QuestionView, TimerBar } from '@/components/quiz';
import { Screen, TopBar, Txt } from '@/components/ui';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import { useT } from '@/i18n';
import { dailyQuestions } from '@/lib/daily';
import { QUESTION_TIME_MS, scoreAnswer } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { useTelegramCloseGuard } from '@/services/telegram';
import { todayKey, useGame, type AnswerLog } from '@/store/useGameStore';
import { space } from '@/theme/tokens';

export default function DailyPlay() {
  const { t } = useT();
  // Fixed for the whole attempt, so passing midnight mid-round does not switch questions.
  const [day] = useState(todayKey);
  const questions = useMemo(() => dailyQuestions(day), [day]);

  const record = useGame((s) => s.dailyHistory[day]);
  const progress = useGame((s) => s.dailyProgress);
  const recordDailyAnswer = useGame((s) => s.recordDailyAnswer);
  const finishDaily = useGame((s) => s.finishDaily);
  // No banner on someone's very first Daily: the first minute in the app stays ad-free.
  const playedBefore = useGame((s) => Object.keys(s.dailyHistory).length > 0);
  const banner = useQuizAd('daily', { disabled: !playedBefore });

  const answers = useMemo(() => (progress?.day === day ? progress.answers : []), [progress, day]);
  // Resume where the player left off if the app was closed mid-round.
  const [index, setIndex] = useState(() => answers.length);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [exitTo, setExitTo] = useState<Href | null>(null);

  const pq = questions[Math.min(index, questions.length - 1)];
  const isLast = index >= questions.length - 1;
  const score = answers.reduce((sum, a) => sum + a.points, 0);

  const answer = useCallback(
    (pick: number | null, elapsedMs: number) => {
      if (revealed) return;
      const correct = pick === 0;
      const log: AnswerLog = {
        questionId: pq.question.id,
        pick,
        mark: pick === null ? 'timeout' : correct ? 'correct' : 'wrong',
        points: scoreAnswer(correct, elapsedMs),
      };
      recordDailyAnswer(day, log);
      setRevealed(log);
      if (correct) haptic.success();
      else haptic.error();
    },
    [revealed, pq, recordDailyAnswer, day],
  );

  const timer = useQuestionTimer(pq.question.id, !revealed && !record && !confirmQuit, QUESTION_TIME_MS, () =>
    answer(null, QUESTION_TIME_MS),
  );

  const next = () => {
    if (isLast) {
      finishDaily(day);
      setExitTo('/daily/result');
      return;
    }
    setRevealed(null);
    setIndex((i) => i + 1);
  };

  const quit = () => {
    setConfirmQuit(false);
    finishDaily(
      day,
      questions.map((q) => q.question.id),
    );
    setExitTo('/home');
  };

  // Navigate only after the store has the finished record, so the back guard below is off.
  useEffect(() => {
    if (!exitTo || !record) return;
    if (exitTo === '/home') router.dismissTo('/home');
    else router.replace(exitTo);
  }, [exitTo, record]);

  const midRound = answers.length > 0 && !record;
  usePreventRemove(midRound, () => setConfirmQuit(true));
  // Inside Telegram, closing the whole Mini App mid-round asks first too.
  useTelegramCloseGuard(midRound);

  const onClose = () => {
    if (midRound) setConfirmQuit(true);
    else router.dismissTo('/home');
  };

  if (record && !exitTo) return <Redirect href="/daily/result" />;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        onLeft={onClose}
        center={<ProgressDots marks={answers.map((a) => a.mark)} total={questions.length} current={index} />}
        right={
          <Pop trigger={score}>
            <Txt variant="bodyStrong" style={styles.score}>
              {score}
            </Txt>
          </Pop>
        }
      />

      <View style={{ gap: space.sm }}>
        <Txt variant="small" tone="muted">
          {t('quiz.question', { n: index + 1, total: questions.length })}
        </Txt>
        <TimerBar remaining={timer.remaining} limit={QUESTION_TIME_MS} stopped={!!revealed} />
      </View>

      <QuestionView
        pq={pq}
        revealed={revealed}
        onPick={(choice) => {
          haptic.tap();
          answer(choice, timer.elapsed());
        }}
      />

      {revealed && (
        <AnswerReveal
          ad={banner}
          pq={pq}
          revealed={revealed}
          badge={revealed.mark === 'correct' ? `+${revealed.points} ${t('common.pts')}` : undefined}
          nextLabel={isLast ? t('quiz.finish') : t('quiz.next')}
          onNext={next}
        />
      )}

      <ConfirmDialog
        visible={confirmQuit}
        title={t('quiz.quitTitle')}
        body={t('quiz.quitBody')}
        confirmLabel={t('quiz.quitConfirm')}
        cancelLabel={t('quiz.quitCancel')}
        destructive
        onConfirm={quit}
        onCancel={() => setConfirmQuit(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { minWidth: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
