import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProgressDots, QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { Button, Card, Header, Icon, IconButton, Screen, Txt } from '@/components/ui';
import { opponentName, topicKey, useDuels, type DuelView } from '@/hooks/useDuels';
import { formatMinutes, useT } from '@/i18n';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import {
  botReplyAt,
  DUEL_COINS,
  duelQuestions,
  encodeDuel,
  outcome,
  total,
  type Duel,
  type DuelAnswer,
} from '@/lib/duel';
import { QUESTION_TIME_MS, scoreAnswer } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { appLink, copyText, shareMessage } from '@/services/share';
import { useGame, type AnswerLog } from '@/store/useGameStore';
import { light, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { views, now, fast } = useDuels(2000);
  const view = views.find((v) => v.duel.id === id);
  if (!view) return <Redirect href="/duels" />;
  if (!view.duel.mine) return <DuelTurn key={view.duel.id} duel={view.duel} theirs={view.theirs} />;
  return <DuelResult view={view} now={now} fast={fast} />;
}

/** Your 5 questions. The opponent's result shows after each answer when they have already played. */
function DuelTurn({ duel, theirs }: { duel: Duel; theirs?: DuelAnswer[] }) {
  const { t, lang } = useT();
  const finishDuelTurn = useGame((s) => s.finishDuelTurn);
  const questions = useMemo(() => duelQuestions(duel), [duel]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<DuelAnswer[]>([]);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [finished, setFinished] = useState(false);

  const pq = questions[index];
  const isLast = index >= questions.length - 1;
  const name = opponentName(duel, lang);

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
      setAnswers((a) => [...a, { mark: log.mark, points: log.points, pick }]);
      setRevealed(log);
      if (correct) haptic.success();
      else haptic.error();
    },
    [revealed, pq],
  );

  const timer = useQuestionTimer(`${duel.id}:${pq.question.id}`, !revealed && !confirmQuit && !finished, QUESTION_TIME_MS, () =>
    answer(null, QUESTION_TIME_MS),
  );

  const finish = (all: DuelAnswer[]) => {
    setFinished(true);
    finishDuelTurn(duel, all);
  };

  const next = () => {
    if (isLast) return finish(answers);
    setRevealed(null);
    setIndex((i) => i + 1);
  };

  const midTurn = answers.length > 0 && !finished;
  usePreventRemove(midTurn, () => setConfirmQuit(true));

  const their = theirs?.[index];
  const theirLine =
    revealed && their
      ? t('duel.them', {
          name,
          result:
            their.mark === 'correct'
              ? t('duel.right', { n: their.points })
              : their.mark === 'wrong'
                ? t('duel.wrongShort')
                : t('duel.timeoutShort'),
        })
      : null;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.top}>
        <IconButton icon="close" onPress={() => (midTurn ? setConfirmQuit(true) : goBack())} label={t('common.close')} />
        <ProgressDots marks={answers.map((a) => a.mark)} total={questions.length} current={index} />
        <Txt variant="bodyStrong" style={styles.score}>
          {total(answers)}
        </Txt>
      </View>
      <View style={{ gap: space.sm }}>
        <Txt variant="small" tone="muted">
          {t('duel.title')} · {name} · {t('quiz.question', { n: index + 1, total: questions.length })}
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
        <RevealPanel
          pq={pq}
          revealed={revealed}
          badge={revealed.mark === 'correct' ? `+${revealed.points} ${t('common.pts')}` : undefined}
          nextLabel={isLast ? t('quiz.finish') : t('quiz.next')}
          onNext={next}
        >
          {theirLine && (
            <View style={styles.them}>
              <Avatar name={name} size={24} />
              <Txt variant="small" style={{ fontWeight: '700', flex: 1 }}>
                {theirLine}
              </Txt>
            </View>
          )}
        </RevealPanel>
      )}

      <ConfirmDialog
        visible={confirmQuit}
        title={t('duel.quitTitle')}
        body={t('duel.quitBody')}
        confirmLabel={t('quiz.quitConfirm')}
        cancelLabel={t('quiz.quitCancel')}
        destructive
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          setConfirmQuit(false);
          // Unanswered questions count as timeouts, as in the Daily Challenge.
          const rest: DuelAnswer[] = questions.slice(answers.length).map(() => ({ mark: 'timeout', points: 0, pick: null }));
          finish([...answers, ...rest]);
        }}
      />
    </Screen>
  );
}

function DuelResult({ view, now, fast }: { view: DuelView; now: number; fast: boolean }) {
  const { colors } = useTheme();
  const { t, L, lang } = useT();
  const { duel, status, theirs } = view;
  const profile = useGame((s) => s.profile);
  const claimDuel = useGame((s) => s.claimDuel);
  const [copied, setCopied] = useState(false);
  const mine = duel.mine!;
  const name = opponentName(duel, lang);
  const questions = useMemo(() => duelQuestions(duel), [duel]);
  const result = theirs ? outcome(mine, theirs) : null;
  const coins = result ? DUEL_COINS[result] : 0;

  // Pay out once, the first time the finished duel is seen.
  useEffect(() => {
    if (!theirs || !result || duel.claimed) return;
    claimDuel(duel.id, theirs, DUEL_COINS[result]);
    if (result === 'win') haptic.success();
  }, [theirs, result, duel.claimed, duel.id, claimDuel]);

  // On this phone a guest is "You"; in the code a friend receives, "Your friend".
  const myName = profile?.name ?? t('ranks.you');
  const codeName = profile?.name ?? t('duel.someone');
  const canReply = duel.role === 'challenged' && duel.opponent.kind === 'code';
  const code = encodeDuel(duel, mine, codeName, canReply ? 'reply' : 'challenge');
  const topic = t(topicKey(duel.category));
  const canShareChallenge = duel.role === 'challenger' && duel.opponent.kind !== 'bot';

  let title: string;
  if (result === 'win') title = t('duel.win');
  else if (result === 'loss') title = t('duel.loss', { name });
  else if (result === 'draw') title = t('duel.draw');
  else if (duel.opponent.kind === 'open') title = t('duel.waitingCode');
  else title = t('duel.waitingFor', { name });

  // The light-theme shades are deep enough for white text in both themes.
  const heroBg = result === 'win' ? light.success : result === 'loss' ? light.danger : result === 'draw' ? light.gold : colors.sponsorStrong;

  return (
    <Screen>
      <Header title={`${t('duel.title')} · ${topic}`} onBack={goBack} />

      <View style={[styles.hero, { backgroundColor: heroBg }]}>
        <Txt variant="title" center style={{ color: '#FFFFFF' }}>
          {title}
        </Txt>
        <View style={styles.versus}>
          <Side name={myName} score={total(mine)} highlight />
          <Txt variant="heading" style={{ color: '#FFFFFF', opacity: 0.8 }}>
            vs
          </Txt>
          <Side name={duel.opponent.kind === 'open' ? '?' : name} score={theirs ? total(theirs) : null} />
        </View>
        {status === 'waiting' && duel.opponent.kind === 'bot' && (
          <Txt variant="small" center style={{ color: '#FFFFFF', opacity: 0.9 }}>
            {t('duel.replyIn', { time: formatMinutes(lang, botReplyAt(duel, fast) - now) })}
          </Txt>
        )}
        {result && duel.claimed && (
          <View style={styles.coins}>
            <Icon name="ellipse" size={14} color={colors.gold} />
            <Txt variant="bodyStrong" tone="gold">
              {t('topics.coinsEarned', { n: coins })}
            </Txt>
          </View>
        )}
      </View>

      {(canShareChallenge || canReply) && (
        <Card>
          <Button
            label={canReply ? t('duel.shareReply') : t('duel.share')}
            icon="share-social"
            onPress={() =>
              shareMessage(
                t(canReply ? 'duel.replyText' : 'duel.shareText', {
                  name: codeName,
                  topic,
                  score: total(mine),
                  link: appLink('/duel/join', code),
                  code,
                }),
              )
            }
          />
          <View style={[styles.code, { backgroundColor: colors.surfaceAlt }]}>
            <Txt selectable variant="small" style={{ fontFamily: 'monospace' }}>
              {code}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button
              small
              kind="secondary"
              icon={copied ? 'checkmark' : 'copy-outline'}
              label={copied ? t('duel.copied') : t('duel.copy')}
              style={{ flex: 1 }}
              onPress={async () => setCopied(await copyText(code))}
            />
            {canShareChallenge && status === 'waiting' && (
              <Button small kind="secondary" icon="enter-outline" label={t('duel.haveReply')} style={{ flex: 1 }} onPress={() => router.push('/duel/join')} />
            )}
          </View>
          <Txt variant="small" tone="muted">
            {t('duel.demoNote')}
          </Txt>
        </Card>
      )}

      <Txt variant="heading">{t('duel.result')}</Txt>
      {questions.map((pq, i) => (
        <Card key={pq.question.id} style={{ gap: space.sm }}>
          <Txt variant="bodyStrong">
            {i + 1}. {L(pq.question.text)}
          </Txt>
          <Txt variant="small" tone="success" style={{ fontWeight: '700' }}>
            ✓ {L(pq.question.choices[0])}
          </Txt>
          <View style={styles.marks}>
            <Mark label={myName} answer={mine[i]} />
            <Mark label={name} answer={theirs?.[i]} />
          </View>
        </Card>
      ))}

      {result && (
        <Button
          label={t('duel.rematch')}
          icon="refresh"
          onPress={() =>
            router.replace({
              pathname: '/duel/new',
              params: {
                bot: duel.opponent.kind === 'bot' ? duel.opponent.botId : 'anyone',
                category: duel.category,
                level: duel.level,
              },
            })
          }
        />
      )}
      <Button label={t('duel.back')} kind="secondary" onPress={() => router.dismissTo('/duels')} />
    </Screen>
  );
}

function Side({ name, score, highlight }: { name: string; score: number | null; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
      <Avatar name={name} size={52} color={highlight ? colors.primary : undefined} />
      <Txt variant="small" numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700' }}>
        {name}
      </Txt>
      <Txt variant="number" style={{ color: '#FFFFFF' }}>
        {score ?? '–'}
      </Txt>
    </View>
  );
}

function Mark({ label, answer }: { label: string; answer?: DuelAnswer }) {
  const { colors } = useTheme();
  const { t } = useT();
  const icon = !answer ? 'hourglass-outline' : answer.mark === 'correct' ? 'checkmark-circle' : answer.mark === 'wrong' ? 'close-circle' : 'time';
  const color = !answer ? colors.textMuted : answer.mark === 'correct' ? colors.success : colors.danger;
  const text = !answer
    ? t('duel.notPlayed')
    : answer.mark === 'correct'
      ? `+${answer.points}`
      : answer.mark === 'wrong'
        ? t('duel.wrongShort')
        : t('duel.timeoutShort');
  return (
    <View style={[styles.mark, { backgroundColor: colors.surfaceAlt }]}>
      <Icon name={icon} size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Txt variant="tiny" tone="muted" numberOfLines={1}>
          {label}
        </Txt>
        <Txt variant="small" style={{ fontWeight: '700', color }}>
          {text}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  score: { minWidth: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
  them: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: space.md },
  versus: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  code: { padding: space.md, borderRadius: radius.md },
  marks: { flexDirection: 'row', gap: space.sm },
  mark: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.sm },
});
