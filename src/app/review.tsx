import { useState } from 'react';
import { View } from 'react-native';

import { QuestionView, RevealPanel } from '@/components/quiz';
import { Button, Header, Icon, Screen, Txt } from '@/components/ui';
import { questionById } from '@/data';
import { useT } from '@/i18n';
import type { PlayableQuestion } from '@/lib/daily';
import { shuffle } from '@/lib/rng';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame, type AnswerLog } from '@/store/useGameStore';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const REVIEW_SIZE = 10;

/** Practice on missed questions. No timer, no lives, no coins; a right answer clears it. */
export default function Review() {
  const { colors } = useTheme();
  const { t } = useT();
  const resolveMissed = useGame((s) => s.resolveMissed);
  const missedNow = useGame((s) => s.missed.length);

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

  if (items.length === 0 || (started && finished)) {
    return (
      <Screen>
        <Header title={t('review.title')} onBack={goBack} />
        <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
          <Icon name={items.length === 0 ? 'happy-outline' : 'checkmark-done-circle'} size={56} color={colors.success} />
          <Txt variant="heading" center>
            {items.length === 0 ? t('review.empty') : `${cleared}/${items.length} ✓`}
          </Txt>
          {items.length > 0 && missedNow > 0 && (
            <Txt tone="muted" center>
              {t('review.count', { n: missedNow })}
            </Txt>
          )}
        </View>
        <Button label={t('common.done')} onPress={goBack} />
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen>
        <Header title={t('review.title')} onBack={goBack} />
        <Icon name="refresh-circle" size={56} color={colors.primary} />
        <Txt variant="title">{t('review.count', { n: missedNow })}</Txt>
        <Txt tone="muted">{t('review.body')}</Txt>
        <Button label={t('review.start')} icon="play" onPress={() => setStarted(true)} />
      </Screen>
    );
  }

  const pq = items[index];
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <Header title={t('review.title')} onBack={goBack} right={<Txt tone="muted">{t('review.left', { n: items.length - index })}</Txt>} />
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
        <RevealPanel
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
