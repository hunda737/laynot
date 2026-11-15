import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OutOfLivesSheet } from '@/components/OutOfLivesSheet';
import { ProgressDots, QuestionView, RevealPanel, TimerBar } from '@/components/quiz';
import { AdBanner, useQuizAd } from '@/components/AdBanner';
import { Confetti, FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { useRewardedAd } from '@/components/RewardedAd';
import { CoinChip, Hearts } from '@/components/status';
import { Button, HeroCard, Screen, TopBar, Txt } from '@/components/ui';
import { CATEGORIES, type CategoryId } from '@/data/questions';
import { SponsorStrip } from '@/components/SponsorStrip';
import { SPONSOR_BY_ID, sponsoredCategory } from '@/data/sponsors';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import { useT, type StringKey } from '@/i18n';
import { coinsFor, correctCoins } from '@/lib/difficulty';
import { fiftyFifty, HINT_COST } from '@/lib/economy';
import { settleLives } from '@/lib/lives';
import { QUESTION_TIME_MS, type AnswerMark } from '@/lib/scoring';
import { topicRound } from '@/lib/topics';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { nowTs, refillMsOf, todayKey, useGame, type AnswerLog } from '@/store/useGameStore';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const currentLives = () => {
  const s = useGame.getState();
  return settleLives({ lives: s.lives, anchor: s.livesAnchor }, nowTs(), refillMsOf(s)).lives;
};

export default function TopicScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const [roundNo, setRoundNo] = useState(0);
  if (!CATEGORIES.some((c) => c.id === category)) return <Redirect href="/topics" />;
  return <TopicRound key={roundNo} category={category as CategoryId} onAgain={() => setRoundNo((n) => n + 1)} />;
}

function TopicRound({ category, onAgain }: { category: CategoryId; onAgain: () => void }) {
  const { cat } = useTheme();
  const { t, L } = useT();
  // The sponsor is fixed when the round starts, so a round never changes sponsor midway.
  const [presenter] = useState(() => {
    const p = sponsoredCategory(todayKey());
    return p.category === category ? p.sponsor : undefined;
  });
  const [round] = useState(() =>
    topicRound(category, { level: useGame.getState().topicLevel, sponsorId: presenter?.id }),
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [marks, setMarks] = useState<AnswerMark[]>([]);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [outOfLives, setOutOfLives] = useState(() => currentLives() <= 0);
  const [done, setDone] = useState<{ coins: number; endedEarly: boolean; doubled: boolean } | null>(null);

  const loseLife = useGame((s) => s.loseLife);
  const spendCoins = useGame((s) => s.spendCoins);
  const addCoins = useGame((s) => s.addCoins);
  const finishTopicRound = useGame((s) => s.finishTopicRound);
  const missedCount = useGame((s) => s.missed.length);
  const adsLeft = useAdsLeft();
  const ad = useRewardedAd();
  // A sponsored round already carries its sponsor's strip and question, so it gets no banner.
  const banner = useQuizAd('topic', { disabled: !!presenter });
  const correctCount = answers.filter((a) => a.mark === 'correct').length;
  const shownCorrect = useCountUp(done ? correctCount : 0, 700);

  const pq = round[index];
  const isLast = index >= round.length - 1;
  const sponsor = pq.sponsorId ? SPONSOR_BY_ID[pq.sponsorId] : undefined;

  const answer = useCallback(
    (pick: number | null) => {
      if (revealed || done) return;
      const correct = pick === 0;
      const log: AnswerLog = {
        questionId: pq.question.id,
        pick,
        mark: pick === null ? 'timeout' : correct ? 'correct' : 'wrong',
        points: 0,
      };
      if (correct) haptic.success();
      else {
        haptic.error();
        loseLife();
      }
      setAnswers((a) => [...a, log]);
      setMarks((m) => [...m, log.mark]);
      setRevealed(log);
    },
    [revealed, done, pq, loseLife],
  );

  const timer = useQuestionTimer(
    pq.question.id,
    !revealed && !done && !outOfLives && !ad.modal,
    QUESTION_TIME_MS,
    () => answer(null),
    { holdOnPause: true },
  );

  const finish = (endedEarly: boolean, finalAnswers = answers) => {
    const coins = correctCoins(finalAnswers);
    finishTopicRound(category, finalAnswers, coins);
    setOutOfLives(false);
    setDone({ coins, endedEarly, doubled: false });
  };

  const advance = () => {
    setRevealed(null);
    setHidden([]);
    setNotice(null);
    setIndex((i) => i + 1);
  };

  const next = () => {
    if (isLast) return finish(false);
    if (currentLives() <= 0) return setOutOfLives(true);
    advance();
  };

  const buyFifty = () => {
    if (!spendCoins(HINT_COST.fifty)) return setNotice(t('topics.notEnough'));
    haptic.tap();
    setHidden(fiftyFifty());
  };

  const buySkip = () => {
    if (!spendCoins(HINT_COST.skip)) return setNotice(t('topics.notEnough'));
    haptic.tap();
    setMarks((m) => [...m, 'timeout']);
    if (isLast) finish(false);
    else advance();
  };

  if (done) {
    const earned = done.doubled ? done.coins * 2 : done.coins;
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <TopBar left="close" title={t(`cat.${category}` as StringKey)} right={<Hearts />} />
        <PopIn>
          <HeroCard color={cat[category].solid} align="center" watermark="trophy">
            <Txt variant="title" tone="onAccent">
              {t('topics.doneTitle')}
            </Txt>
            <Txt variant="number" tone="onAccent" center style={{ fontVariant: ['tabular-nums'] }}>
              {t('topics.doneScore', { n: shownCorrect, total: round.length })}
            </Txt>
            <View style={{ marginTop: space.sm }}>
              <CoinChip amount={earned} prefix="+" variant="onColor" />
            </View>
          </HeroCard>
        </PopIn>
        {presenter && (
          <SponsorStrip
            sponsor={presenter}
            message={t('sponsor.thanks', { category: t(`cat.${category}` as StringKey), name: presenter.name })}
          />
        )}
        {done.endedEarly && (
          <Txt tone="muted" center>
            {t('topics.endedNoLives')}
          </Txt>
        )}
        <FadeInUp delay={200} style={{ gap: space.md }}>
          {done.coins > 0 &&
            (done.doubled ? (
              <Txt tone="success" center variant="bodyStrong">
                {t('topics.doubled')}
              </Txt>
            ) : (
              <Button
                label={adsLeft > 0 ? t('topics.double', { n: done.coins }) : t('ad.capReached')}
                kind="sponsor"
                icon="play-circle"
                disabled={adsLeft <= 0}
                onPress={() =>
                  ad.show(t('ad.rewardCoins', { n: done.coins }), () => {
                    addCoins(done.coins);
                    setDone({ ...done, doubled: true });
                  })
                }
              />
            ))}
          <Button
            label={t('topics.again')}
            icon="refresh"
            onPress={() => (currentLives() > 0 ? onAgain() : setOutOfLives(true))}
          />
          <Button label={t('topics.other')} kind="secondary" onPress={() => router.dismissTo('/topics')} />
          {missedCount > 0 && (
            <Button label={t('review.title')} kind="ghost" icon="refresh" onPress={() => router.push('/review')} />
          )}
        </FadeInUp>
        {!presenter && <AdBanner placement="result" seed="topic" />}
        <OutOfLivesSheet visible={outOfLives} onClose={() => setOutOfLives(false)} />
        {ad.modal}
        <Confetti fire={correctCount === round.length} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} footer={banner.footer}>
      <TopBar
        left="close"
        center={<ProgressDots marks={marks} total={round.length} current={index} />}
        right={<Hearts />}
      />

      {presenter && <SponsorStrip sponsor={presenter} compact />}

      <View style={{ gap: space.sm }}>
        <View style={styles.subRow}>
          <Txt variant="small" tone="muted">
            {t('quiz.question', { n: index + 1, total: round.length })}
          </Txt>
          <CoinChip size="sm" />
        </View>
        <TimerBar remaining={timer.remaining} limit={QUESTION_TIME_MS} stopped={!!revealed} />
      </View>

      <QuestionView
        pq={pq}
        revealed={revealed}
        hidden={hidden}
        label={sponsor ? t('sponsor.by', { name: sponsor.name }) : undefined}
        onPick={(choice) => {
          haptic.tap();
          answer(choice);
        }}
      />

      {!revealed && (
        <View style={{ gap: space.sm }}>
          <View style={styles.hints}>
            <Button
              small
              kind="secondary"
              icon="git-compare"
              label={t('topics.hintFifty', { n: HINT_COST.fifty })}
              disabled={hidden.length > 0}
              onPress={buyFifty}
              style={{ flex: 1 }}
            />
            <Button
              small
              kind="secondary"
              icon="play-skip-forward"
              label={t('topics.hintSkip', { n: HINT_COST.skip })}
              onPress={buySkip}
              style={{ flex: 1 }}
            />
          </View>
          {adsLeft > 0 && hidden.length === 0 && (
            <Button
              small
              kind="ghost"
              icon="play-circle"
              label={t('topics.hintFree')}
              onPress={() => ad.show(t('ad.rewardHint'), () => setHidden(fiftyFifty()))}
            />
          )}
          {notice && (
            <Txt variant="small" tone="danger" center>
              {notice}
            </Txt>
          )}
        </View>
      )}

      {revealed && (
        <RevealPanel
          pq={pq}
          revealed={revealed}
          badge={
            revealed.mark === 'correct'
              ? t('topics.coinsEarned', { n: coinsFor(pq.question.difficulty) })
              : t('lives.lost')
          }
          nextLabel={isLast ? t('quiz.finish') : t('quiz.next')}
          onNext={next}
        >
          {sponsor && <SponsorStrip sponsor={sponsor} message={L(sponsor.tagline)} />}
        </RevealPanel>
      )}

      {banner.inline}

      <OutOfLivesSheet
        visible={outOfLives}
        onLifeGained={() => {
          setOutOfLives(false);
          if (revealed) advance();
        }}
        onClose={() => {
          // Closing without a new life ends the round with what the player has so far.
          if (currentLives() > 0) {
            setOutOfLives(false);
            if (revealed) advance();
          } else if (answers.length > 0) finish(true);
          else goBack();
        }}
      />
      {ad.modal}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hints: { flexDirection: 'row', gap: space.sm },
});
