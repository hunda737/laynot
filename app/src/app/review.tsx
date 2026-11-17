import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuizAd } from '@/components/AdBanner';
import { Confetti, FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { AnswerReveal, QuestionView } from '@/components/quiz';
import { Button, HeroCard, Icon, ProgressBar, Screen, TopBar, Txt } from '@/components/ui';
import { questionById } from '@/data';
import { useT } from '@/i18n';
import type { PlayableQuestion } from '@/lib/daily';
import { shuffle } from '@/lib/rng';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame, type AnswerLog } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const REVIEW_SIZE = 10;

/** Practice on missed questions. No timer, no lives, no coins; a right answer clears it. */
export default function Review() {
  const { colors } = useTheme();
  const { t } = useT();
  const resolveMissed = useGame((s) => s.resolveMissed);
  const missedNow = useGame((s) => s.missed.length);
  const banner = useQuizAd('review');

  // Snapshot at open, so clearing questions does not reshuffle the list mid-review.
  const [items] = useState<PlayableQuestion[]>(() =>
    useGame
      .getState()
      .missed.slice(0, REVIEW_SIZE)
      .map((id) => questionById(id))
      .filter((q) => q !== undefined)
      .map((question) => ({ question, order: shuffle([0, 1, 2, 3], Math.random) })),
  );
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<AnswerLog | null>(null);
  const [cleared, setCleared] = useState(0);

  const finished = index >= items.length;
  const empty = items.length === 0;
  const shownCleared = useCountUp(started && finished ? cleared : 0, 700);

  if (empty || (started && finished)) {
    return (
      <Screen>
        <TopBar title={t('review.title')} />
        <PopIn>
          <HeroCard color={modeColors.review} align="center">
            <View style={styles.heroIcon}>
              <Icon name={empty ? 'happy-outline' : 'checkmark-done'} size={34} color={colors.onAccent} />
            </View>
            {empty ? (
              <Txt variant="heading" tone="onAccent" center>
                {t('review.empty')}
              </Txt>
            ) : (
              <>
                <Txt variant="number" tone="onAccent" center style={{ fontVariant: ['tabular-nums'] }}>
                  {shownCleared}/{items.length}
                </Txt>
                {missedNow > 0 && (
                  <Txt variant="bodyStrong" tone="onAccent" center style={{ opacity: 0.92 }}>
                    {t('review.count', { n: missedNow })}
                  </Txt>
                )}
              </>
            )}
          </HeroCard>
        </PopIn>
        <FadeInUp delay={200}>
          <Button label={t('common.done')} onPress={goBack} />
        </FadeInUp>
        <Confetti fire={!empty && cleared === items.length} />
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen>
        <TopBar title={t('review.title')} />
        <PopIn>
          <HeroCard color={modeColors.review} watermark="refresh-circle">
            <View style={styles.heroIcon}>
              <Icon name="refresh" size={30} color={colors.onAccent} />
            </View>
            <Txt variant="title" tone="onAccent">
              {t('review.count', { n: missedNow })}
            </Txt>
            <Txt tone="onAccent" style={{ opacity: 0.92 }}>
              {t('review.body')}
            </Txt>
          </HeroCard>
        </PopIn>
        <FadeInUp delay={200}>
          <Button label={t('review.start')} icon="play" onPress={() => setStarted(true)} />
        </FadeInUp>
      </Screen>
    );
  }

  const pq = items[index];
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        title={t('review.title')}
        right={
          <Txt variant="small" tone="muted" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {t('review.left', { n: items.length - index })}
          </Txt>
        }
      />
      <ProgressBar value={index + (revealed ? 1 : 0)} max={items.length} color={modeColors.review} />
      <QuestionView
        pq={pq}
        revealed={revealed}
        onPick={(pick) => {
          const correct = pick === 0;
          if (correct) {
            haptic.success();
            resolveMissed(pq.question.id);
            setCleared((c) => c + 1);
          } else haptic.error();
          setRevealed({ questionId: pq.question.id, pick, mark: correct ? 'correct' : 'wrong', points: 0 });
        }}
      />
      {revealed && (
        <AnswerReveal
          ad={banner}
          pq={pq}
          revealed={revealed}
          badge={revealed.mark === 'correct' ? t('review.removed') : t('review.again')}
          nextLabel={index === items.length - 1 ? t('common.done') : t('quiz.next')}
          onNext={() => {
            setRevealed(null);
            setIndex((i) => i + 1);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: space.xs,
  },
});
