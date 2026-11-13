import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProgressDots, QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { StreetStats } from '@/components/StreetStats';
import { Button, Icon, IconButton, Screen, Txt } from '@/components/ui';
import { EPISODE_BY_ID, streetAverage, type StreetEpisode } from '@/data/street';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import { useT } from '@/i18n';
import { TOPIC_COINS_PER_CORRECT } from '@/lib/economy';
import { shuffle } from '@/lib/rng';
import { QUESTION_TIME_MS } from '@/lib/scoring';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
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

  const [items] = useState(() => ep.questions.map((question) => ({ question, order: shuffle([0, 1, 2, 3], Math.random) })));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [clipNote, setClipNote] = useState(false);
  const [done, setDone] = useState<{ coins: number; replay: boolean } | null>(null);

  const pq = items[index];
  const isLast = index >= items.length - 1;

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
    const you = answers.filter((a) => a.mark === 'correct').length;
    const avg = streetAverage(ep);
    const beat = you > avg;
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.top}>
          <IconButton icon="close" onPress={goBack} label={t('common.close')} />
          <Txt variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {L(ep.title)}
          </Txt>
        </View>
        <View style={[styles.hero, { backgroundColor: beat ? colors.success : ep.color }]}>
          <Icon name={beat ? 'trophy' : 'people'} size={44} color="#FFFFFF" />
          <Txt variant="title" center style={{ color: '#FFFFFF' }}>
            {beat ? t('street.beat') : t('street.lost')}
          </Txt>
          <Txt variant="bodyStrong" center style={{ color: '#FFFFFF', opacity: 0.92 }}>
            {t('street.summary', { you, avg: avg.toFixed(1), total: items.length })}
          </Txt>
          <CompareBars you={you} avg={avg} total={items.length} />
          {done.coins > 0 && (
            <View style={styles.coins}>
              <Icon name="ellipse" size={16} color={colors.gold} />
              <Txt variant="bodyStrong" style={{ color: colors.gold }}>
                {t('topics.coinsEarned', { n: done.coins })}
              </Txt>
            </View>
          )}
        </View>
        {done.replay && (
          <Txt tone="muted" center>
            {t('street.replayNote')}
          </Txt>
        )}
        <Button label={t('street.more')} icon="albums" onPress={() => router.dismissTo('/street')} />
        <Button label={t('street.replay')} kind="secondary" icon="refresh" onPress={onAgain} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.top}>
        <IconButton icon="close" onPress={goBack} label={t('common.close')} />
        <ProgressDots marks={answers.map((a) => a.mark)} total={items.length} current={index} />
      </View>
      <View style={[styles.banner, { backgroundColor: ep.color }]}>
        <Icon name="mic" size={16} color="#FFFFFF" />
        <Txt variant="small" style={{ color: '#FFFFFF', fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {L(ep.location)} · {t('street.asked', { n: ep.peopleAsked })}
        </Txt>
      </View>
      <TimerBar remaining={timer.remaining} limit={QUESTION_TIME_MS} stopped={!!revealed} />

      <QuestionView
        pq={pq}
        revealed={revealed}
        label={t('quiz.question', { n: index + 1, total: items.length })}
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
              ? t('topics.coinsEarned', { n: TOPIC_COINS_PER_CORRECT })
              : undefined
          }
          nextLabel={isLast ? t('quiz.finish') : t('quiz.next')}
          onNext={next}
        >
          <StreetStats question={pq.question} order={pq.order} pick={revealed.pick} />
          <Button
            small
            kind="ghost"
            icon="logo-tiktok"
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
    </Screen>
  );
}

function CompareBars({ you, avg, total }: { you: number; avg: number; total: number }) {
  const { t } = useT();
  const row = (label: string, value: number, strong: boolean) => (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="small" style={{ color: '#FFFFFF', fontWeight: strong ? '800' : '600' }}>
          {label}
        </Txt>
        <Txt variant="small" style={{ color: '#FFFFFF', fontWeight: '800' }}>
          {value % 1 === 0 ? value : value.toFixed(1)}/{total}
        </Txt>
      </View>
      <View style={styles.cmpTrack}>
        <View style={[styles.cmpBar, { width: `${(value / total) * 100}%`, opacity: strong ? 1 : 0.6 }]} />
      </View>
    </View>
  );
  return (
    <View style={{ alignSelf: 'stretch', gap: space.sm, marginTop: space.sm }}>
      {row(t('street.youLabel'), you, true)}
      {row(t('street.avgLabel'), avg, false)}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, paddingHorizontal: space.md, borderRadius: radius.sm },
  hero: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.sm },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    marginTop: space.sm,
  },
  cmpTrack: { height: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  cmpBar: { height: '100%', borderRadius: radius.pill, backgroundColor: '#FFFFFF' },
});
