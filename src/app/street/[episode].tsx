import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuizAd } from '@/components/AdBanner';
import { Confetti, FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { ProgressDots, QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { CoinChip } from '@/components/status';
import { StreetStats } from '@/components/StreetStats';
import { Button, HeroCard, Icon, ProgressBar, Screen, TopBar, Txt } from '@/components/ui';
import { EPISODE_BY_ID, streetAverage, type StreetEpisode } from '@/data/street';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import { useT } from '@/i18n';
import { coinsFor } from '@/lib/difficulty';
import { shuffle } from '@/lib/rng';
import { QUESTION_TIME_MS } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { useGame, type AnswerLog } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function EpisodeScreen() {
  const { episode } = useLocalSearchParams<{ episode: string }>();
  const [roundNo, setRoundNo] = useState(0);
  const ep = EPISODE_BY_ID[episode ?? ''];
  if (!ep) return <Redirect href="/street" />;
  return <EpisodeRound key={roundNo} ep={ep} onAgain={() => setRoundNo((n) => n + 1)} />;
}

function EpisodeRound({ ep, onAgain }: { ep: StreetEpisode; onAgain: () => void }) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const finishStreet = useGame((s) => s.finishStreet);
  const alreadyPlayed = useGame((s) => !!s.streetResults[ep.id]);
  const banner = useQuizAd('street');

  const [items] = useState(() => ep.questions.map((question) => ({ question, order: shuffle([0, 1, 2, 3], Math.random) })));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [clipNote, setClipNote] = useState(false);
  const [done, setDone] = useState<{ coins: number; replay: boolean } | null>(null);

  const pq = items[index];
  const isLast = index >= items.length - 1;
  const you = answers.filter((a) => a.mark === 'correct').length;
  const shownYou = useCountUp(done ? you : 0, 700);

  const answer = useCallback(
    (pick: number | null) => {
      if (revealed) return;
      const correct = pick === 0;
      const log: AnswerLog = {
        questionId: pq.question.id,
        pick,
        mark: pick === null ? 'timeout' : correct ? 'correct' : 'wrong',
        points: 0,
      };
      if (correct) haptic.success();
      else haptic.error();
      setAnswers((a) => [...a, log]);
      setRevealed(log);
    },
    [revealed, pq],
  );

  const timer = useQuestionTimer(pq.question.id, !revealed && !done, QUESTION_TIME_MS, () => answer(null));

  const next = () => {
    if (isLast) {
      const replay = alreadyPlayed;
      setDone({ coins: finishStreet(ep.id, answers), replay });
      return;
    }
    setRevealed(null);
    setClipNote(false);
    setIndex((i) => i + 1);
  };

  if (done) {
    const avg = streetAverage(ep);
    const beat = you > avg;
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <TopBar left="close" title={L(ep.title)} />
        <PopIn>
          <HeroCard color={ep.color} align="center" watermark={beat ? 'trophy' : 'people'}>
            <Txt variant="title" tone="onAccent" center>
              {beat ? t('street.beat') : t('street.lost')}
            </Txt>
            <Txt
              variant="number"
              tone="onAccent"
              center
              style={{ fontVariant: ['tabular-nums'] }}
              accessibilityLabel={t('street.summary', { you, avg: avg.toFixed(1), total: items.length })}
            >
              {shownYou}/{items.length}
            </Txt>
            <CompareBars you={you} avg={avg} total={items.length} />
            {done.coins > 0 && (
              <View style={{ marginTop: space.sm }}>
                <CoinChip amount={done.coins} prefix="+" variant="onColor" />
              </View>
            )}
          </HeroCard>
        </PopIn>
        {done.replay && (
          <Txt tone="muted" center>
            {t('street.replayNote')}
          </Txt>
        )}
        <FadeInUp delay={200} style={{ gap: space.md }}>
          <Button label={t('street.more')} icon="albums" onPress={() => router.dismissTo('/street')} />
          <Button label={t('street.replay')} kind="secondary" icon="refresh" onPress={onAgain} />
        </FadeInUp>
        <Confetti fire={beat} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} footer={banner.footer}>
      <TopBar
        left="close"
        center={<ProgressDots marks={answers.map((a) => a.mark)} total={items.length} current={index} />}
      />

      <View style={[styles.strip, { backgroundColor: ep.color }]}>
        <Icon name="mic" size={16} color={colors.onAccent} />
        <Txt variant="small" tone="onAccent" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {L(ep.location)} · {t('street.asked', { n: ep.peopleAsked })}
        </Txt>
      </View>

      <View style={{ gap: space.sm }}>
        <Txt variant="small" tone="muted">
          {t('quiz.question', { n: index + 1, total: items.length })}
        </Txt>
        <TimerBar remaining={timer.remaining} limit={QUESTION_TIME_MS} stopped={!!revealed} />
      </View>

      <QuestionView
        pq={pq}
        revealed={revealed}
        onPick={(choice) => {
          haptic.tap();
          answer(choice);
        }}
      />

      {revealed && (
        <RevealPanel
          pq={pq}
          revealed={revealed}
          badge={
            revealed.mark === 'correct' && !alreadyPlayed
              ? t('topics.coinsEarned', { n: coinsFor(pq.question.difficulty) })
              : undefined
          }
          nextLabel={isLast ? t('quiz.finish') : t('quiz.next')}
          onNext={next}
        >
          <StreetStats question={pq.question} order={pq.order} pick={revealed.pick} />
          <Button
            small
            kind="ghost"
            icon="play-circle-outline"
            label={t('street.watch', { time: pq.question.clipAt })}
            onPress={() => setClipNote(true)}
          />
          {clipNote && (
            <Txt variant="small" tone="muted" center>
              {t('street.clipNote', { time: pq.question.clipAt })}
            </Txt>
          )}
        </RevealPanel>
      )}

      {banner.inline}
    </Screen>
  );
}

/** Your score against the street's, as two bars on the result card. */
function CompareBars({ you, avg, total }: { you: number; avg: number; total: number }) {
  const { colors } = useTheme();
  const { t } = useT();
  const row = (label: string, value: number, strong: boolean) => (
    <View style={{ gap: 4 }}>
      <View style={styles.cmpLabels}>
        <Txt variant="small" tone="onAccent" style={{ fontWeight: strong ? '800' : '600' }}>
          {label}
        </Txt>
        <Txt variant="small" tone="onAccent" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {value % 1 === 0 ? value : value.toFixed(1)}/{total}
        </Txt>
      </View>
      <ProgressBar
        value={value}
        max={total}
        height={10}
        durationMs={700}
        color={strong ? colors.onAccent : 'rgba(255,255,255,0.6)'}
        trackColor="rgba(255,255,255,0.25)"
      />
    </View>
  );
  return (
    <View style={styles.cmp}>
      {row(t('street.youLabel'), you, true)}
      {row(t('street.avgLabel'), avg, false)}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
  },
  cmp: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
  cmpLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
