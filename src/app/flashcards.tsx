import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DifficultyPicker } from '@/components/difficulty';
import { FlashCard } from '@/components/FlashCard';
import { CoinsPill } from '@/components/status';
import { Button, Card, Icon, IconButton, Screen, Txt } from '@/components/ui';
import type { FlashCard as FlashCardData } from '@/data/flashcards';
import { useT } from '@/i18n';
import { flashDeck, knownFirstTry, markCard, missedCards, runFinished, startRun, type FlashRun } from '@/lib/flash';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { useGame } from '@/store/useGameStore';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

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

  const end = (finalRun: FlashRun, completed: boolean) => {
    const coins = finishFlashRound(Object.keys(finalRun.firstTry).length, knownFirstTry(finalRun), completed);
    if (completed) haptic.success();
    setDone({ coins, completed });
  };

  const mark = (known: boolean) => {
    if (known) haptic.success();
    else haptic.tap();
    const next = markCard(run, known);
    setRun(next);
    setFlipped(false);
    setTurnNo((n) => n + 1);
    setNotice(!known);
    if (runFinished(next)) end(next, true);
  };

  if (done) {
    const repeated = missedCards(run).map(byId);
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.top}>
          <IconButton icon="close" onPress={goBack} label={t('common.close')} />
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('flash.title')}
          </Txt>
          <CoinsPill />
        </View>
        <View style={[styles.hero, { backgroundColor: colors.sponsorStrong }]}>
          <Icon name="albums" size={40} color="#FFFFFF" />
          <Txt variant="title" style={{ color: '#FFFFFF' }}>
            {t('flash.doneTitle')}
          </Txt>
          <Txt variant="bodyStrong" center style={{ color: '#FFFFFF' }}>
            {t('flash.doneScore', { n: knownFirstTry(run), total: Object.keys(run.firstTry).length })}
          </Txt>
          {done.coins > 0 && (
            <View style={[styles.coins, { backgroundColor: '#FFFFFF' }]}>
              <Icon name="ellipse" size={16} color={colors.gold} />
              <Txt variant="bodyStrong" tone="gold">
                {t('flash.roundCoins', { n: done.coins })}
              </Txt>
            </View>
          )}
        </View>

        {repeated.length > 0 && (
          <Card>
            <Txt variant="heading">{t('flash.repeat')}</Txt>
            {repeated.map((c) => (
              <View key={c.id} style={{ gap: 2 }}>
                <Txt variant="small" tone="muted">
                  {L(c.front)}
                </Txt>
                <Txt variant="bodyStrong">{L(c.back)}</Txt>
              </View>
            ))}
          </Card>
        )}

        <DifficultyPicker value={level} onChange={setLevel} />
        <Button label={t('flash.newDeck')} icon="refresh" onPress={onNewDeck} />
        <Button label={t('flash.back')} kind="secondary" onPress={() => router.dismissTo('/topics')} />
      </Screen>
    );
  }

  const total = deck.length;
  const cleared = run.cleared.length;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.top}>
        <IconButton icon="close" onPress={goBack} label={t('common.close')} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.fill, { backgroundColor: colors.sponsor, width: `${(100 * cleared) / total}%` }]} />
          </View>
          <Txt variant="small" tone="muted">
            {t('flash.progress', { n: cleared, total })}
          </Txt>
        </View>
        <CoinsPill />
      </View>

      {current && (
        <FlashCard
          key={`${current.id}-${turnNo}`}
          card={current}
          flipped={flipped}
          again={current.id in run.firstTry}
          onFlip={() => {
            haptic.tap();
            setFlipped(true);
            setNotice(false);
          }}
        />
      )}

      {flipped ? (
        <View style={styles.marks}>
          <Button label={t('flash.missed')} kind="secondary" icon="close" onPress={() => mark(false)} style={{ flex: 1 }} />
          <Button label={t('flash.got')} icon="checkmark" onPress={() => mark(true)} style={{ flex: 1 }} />
        </View>
      ) : (
        <Button
          label={t('flash.tap')}
          kind="secondary"
          icon="sync"
          onPress={() => {
            haptic.tap();
            setFlipped(true);
            setNotice(false);
          }}
        />
      )}

      {notice && (
        <Txt variant="small" tone="gold" center style={{ fontWeight: '700' }}>
          {t('flash.comesBack')}
        </Txt>
      )}

      <Txt variant="small" tone="muted" center>
        {t('flash.body')}
      </Txt>
      {Object.keys(run.firstTry).length > 0 && (
        <Button label={t('flash.end')} kind="ghost" small onPress={() => end(run, false)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  marks: { flexDirection: 'row', gap: space.sm },
  hero: { borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.sm },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: space.sm,
  },
});
