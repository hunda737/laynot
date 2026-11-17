import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DifficultyPicker } from '@/components/difficulty';
import { FlashCard } from '@/components/FlashCard';
import { Confetti, FadeInUp, PopIn, useCountUp } from '@/components/motion';
import { CoinChip } from '@/components/status';
import { Button, Card, HeroCard, ProgressBar, Screen, TopBar, Txt } from '@/components/ui';
import type { FlashCard as FlashCardData } from '@/data/flashcards';
import { useT } from '@/i18n';
import { flashDeck, knownFirstTry, markCard, missedCards, runFinished, startRun, type FlashRun } from '@/lib/flash';
import { haptic } from '@/services/haptics';
import { useGame } from '@/store/useGameStore';
import { modeColors, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Rows past this one arrive together, so a long list does not keep the reader waiting. */
const MAX_STAGGER = 10;

export default function FlashCardsScreen() {
  const [deckNo, setDeckNo] = useState(0);
  return <FlashRound key={deckNo} onNewDeck={() => setDeckNo((n) => n + 1)} />;
}

function FlashRound({ onNewDeck }: { onNewDeck: () => void }) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const level = useGame((s) => s.topicLevel);
  const setLevel = useGame((s) => s.setTopicLevel);
  const finishFlashRound = useGame((s) => s.finishFlashRound);

  const [deck] = useState(() => flashDeck(useGame.getState().topicLevel));
  const [run, setRun] = useState<FlashRun>(() => startRun(deck));
  const [flipped, setFlipped] = useState(false);
  /** Bumped on every mark, so a card that comes back remounts face-down. */
  const [turnNo, setTurnNo] = useState(0);
  const [notice, setNotice] = useState(false);
  const [done, setDone] = useState<{ coins: number; completed: boolean } | null>(null);

  const byId = (id: string) => deck.find((c) => c.id === id) as FlashCardData;
  const current = run.queue[0] ? byId(run.queue[0]) : null;
  const seen = Object.keys(run.firstTry).length;
  const known = knownFirstTry(run);
  const shownKnown = useCountUp(done ? known : 0, 700);

  const end = (finalRun: FlashRun, completed: boolean) => {
    const coins = finishFlashRound(Object.keys(finalRun.firstTry).length, knownFirstTry(finalRun), completed);
    if (completed) haptic.success();
    setDone({ coins, completed });
  };

  const mark = (gotIt: boolean) => {
    if (gotIt) haptic.success();
    else haptic.tap();
    const next = markCard(run, gotIt);
    setRun(next);
    setFlipped(false);
    setTurnNo((n) => n + 1);
    setNotice(!gotIt);
    if (runFinished(next)) end(next, true);
  };

  const flip = () => {
    haptic.tap();
    setFlipped(true);
    setNotice(false);
  };

  if (done) {
    const repeated = missedCards(run).map(byId);
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <TopBar left="close" title={t('flash.title')} right={<CoinChip />} />
        <PopIn>
          <HeroCard color={modeColors.flash} align="center" watermark="albums">
            <Txt variant="title" tone="onAccent" center>
              {t('flash.doneTitle')}
            </Txt>
            <Txt variant="number" tone="onAccent" center style={{ fontVariant: ['tabular-nums'] }}>
              {shownKnown}/{seen}
            </Txt>
            <Txt variant="bodyStrong" tone="onAccent" center style={{ opacity: 0.92 }}>
              {t('flash.doneScore', { n: known, total: seen })}
            </Txt>
            {done.coins > 0 && (
              <View style={{ marginTop: space.sm }}>
                <CoinChip amount={done.coins} prefix="+" variant="onColor" />
              </View>
            )}
          </HeroCard>
        </PopIn>

        {repeated.length > 0 && (
          <FadeInUp index={1}>
            <Card>
              <Txt variant="heading">{t('flash.repeat')}</Txt>
              {repeated.map((c, i) => (
                <FadeInUp key={c.id} index={Math.min(i + 2, MAX_STAGGER)} style={styles.repeat}>
                  <View style={[styles.repeatDot, { backgroundColor: modeColors.flash }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="small" tone="muted">
                      {L(c.front)}
                    </Txt>
                    <Txt variant="bodyStrong">{L(c.back)}</Txt>
                  </View>
                </FadeInUp>
              ))}
            </Card>
          </FadeInUp>
        )}

        <FadeInUp index={2} style={{ gap: space.lg }}>
          <DifficultyPicker value={level} onChange={setLevel} />
          <Button label={t('flash.newDeck')} icon="refresh" onPress={onNewDeck} />
          <Button label={t('flash.back')} kind="secondary" onPress={() => router.dismissTo('/topics')} />
        </FadeInUp>

        <Confetti fire={done.completed && seen > 0 && known === seen} />
      </Screen>
    );
  }

  const total = deck.length;
  const cleared = run.cleared.length;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        center={
          <View style={styles.progress}>
            <ProgressBar value={cleared} max={total} color={modeColors.flash} />
            <Txt variant="small" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
              {t('flash.progress', { n: cleared, total })}
            </Txt>
          </View>
        }
        right={<CoinChip />}
      />

      {current && (
        // Keyed by turn, so every card rises into place face-down and centred.
        <FadeInUp key={`${current.id}-${turnNo}`}>
          <FlashCard card={current} flipped={flipped} again={current.id in run.firstTry} onFlip={flip} onSwipe={mark} />
        </FadeInUp>
      )}

      {flipped ? (
        <FadeInUp key="marks" distance={8} style={styles.marks}>
          <Button label={t('flash.missed')} kind="secondary" icon="close" onPress={() => mark(false)} style={{ flex: 1 }} />
          <Button label={t('flash.got')} icon="checkmark" onPress={() => mark(true)} style={{ flex: 1 }} />
        </FadeInUp>
      ) : (
        <Button label={t('flash.tap')} kind="secondary" icon="sync" onPress={flip} />
      )}

      {notice && (
        <FadeInUp distance={6}>
          <Txt variant="small" center style={{ fontWeight: '700', color: colors.gold }}>
            {t('flash.comesBack')}
          </Txt>
        </FadeInUp>
      )}

      <Txt variant="small" tone="muted" center>
        {t('flash.body')}
      </Txt>
      {seen > 0 && <Button label={t('flash.end')} kind="ghost" small onPress={() => end(run, false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { flex: 1, gap: 6 },
  marks: { flexDirection: 'row', gap: space.sm },
  repeat: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  repeatDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
