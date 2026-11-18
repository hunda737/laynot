import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { GameDone, Note, useQuitGuard } from '@/components/games/GameKit';
import { Pop, Shake } from '@/components/motion';
import { TimerBar } from '@/components/quiz';
import { useRewardedAd } from '@/components/RewardedAd';
import { CoinChip } from '@/components/status';
import { Button, Card, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { blitzRun, type Statement } from '@/data/games/blitz';
import { useAdsLeft } from '@/hooks/useEconomy';
import { useOpenGame } from '@/hooks/useOpenGame';
import { useT } from '@/i18n';
import {
  applyBlitzAnswer,
  BLITZ_MS,
  BLITZ_START,
  BLITZ_TARGET,
  blitzGrid,
  DAILY_RUN_SIZE,
  EXTRA_TIME_COST,
  EXTRA_TIME_MS,
  MAX_WRONG,
  multiplierFor,
  PRACTICE_RUN_SIZE,
  SKIP_COST,
  WRONG_PENALTY_MS,
  type BlitzState,
} from '@/lib/games/blitz';
import { haptic } from '@/services/haptics';
import { todayKey, useGame } from '@/store/useGameStore';
import { duration, NATIVE_DRIVER, spring, useReducedMotion } from '@/theme/motion';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Phase = 'ready' | 'play' | 'over' | 'done';

interface Outcome {
  points: number;
  solved: boolean;
  coins: number;
  streak?: number;
  grid: string;
}

export default function Blitz() {
  const { t, L } = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const daily = params.mode !== 'practice';
  const [day] = useState(todayKey);
  const [seedKey] = useState(() => (daily ? `blitz:${day}` : `blitz-practice:${Date.now()}`));
  const run = useMemo(() => blitzRun(seedKey, daily ? DAILY_RUN_SIZE : PRACTICE_RUN_SIZE), [seedKey, daily]);

  const stored = useGame((s) => (daily ? s.gameResults[day]?.blitz : undefined));
  const finishGameDaily = useGame((s) => s.finishGameDaily);
  const finishGamePractice = useGame((s) => s.finishGamePractice);
  const spendCoins = useGame((s) => s.spendCoins);
  const adsLeft = useAdsLeft();
  const ad = useRewardedAd();
  const open = useOpenGame();

  const [phase, setPhase] = useState<Phase>(() => (stored ? 'done' : 'ready'));
  const [st, setSt] = useState<BlitzState>(BLITZ_START);
  const [index, setIndex] = useState(0);
  const [missed, setMissed] = useState<Statement[]>([]);
  const [remaining, setRemaining] = useState(BLITZ_MS);
  const [adUsed, setAdUsed] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const deadline = useRef(0);
  /** A throw asked for by a tap or an arrow key; the card flies off the same way as a swipe. */
  const [flick, setFlick] = useState<{ pick: boolean; id: string } | null>(null);

  const finish = (state: BlitzState) => {
    const solved = state.right >= BLITZ_TARGET;
    const grid = blitzGrid(state.marks);
    if (daily) {
      const rec = finishGameDaily('blitz', day, { points: state.score, solved, grid });
      setOutcome({ points: rec.points, solved: rec.solved, coins: rec.coins, streak: rec.streakAfter, grid: rec.grid });
    } else {
      setOutcome({ points: state.score, solved, coins: finishGamePractice(solved), grid });
    }
    setPhase('done');
  };

  // Out of time or out of statements: the round is over. Out of lives: offer one ad continue first.
  const end = (state: BlitzState, reason: 'time' | 'wrong' | 'out') => {
    setRemaining(Math.max(0, deadline.current - Date.now()));
    if (reason === 'wrong' && !adUsed && adsLeft > 0) setPhase('over');
    else finish(state);
  };

  // The ticking clock calls the latest version of this, so it sees the current score.
  const timeUp = useRef(() => {});
  useEffect(() => {
    timeUp.current = () => end(st, 'time');
  });

  useEffect(() => {
    if (phase !== 'play') return;
    const id = setInterval(() => {
      const left = deadline.current - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        timeUp.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // On a computer, the left and right arrow keys throw the card too.
  useEffect(() => {
    if (Platform.OS !== 'web' || phase !== 'play' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      setFlick({ pick: e.key === 'ArrowRight', id: run[index].id });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, run, index]);

  const start = () => {
    deadline.current = Date.now() + BLITZ_MS;
    setRemaining(BLITZ_MS);
    setPhase('play');
  };

  const answer = (pick: boolean) => {
    if (phase !== 'play') return;
    const statement = run[index];
    const right = pick === statement.answer;
    const next = applyBlitzAnswer(st, right);
    if (right) haptic.success();
    else {
      haptic.error();
      deadline.current -= WRONG_PENALTY_MS;
      setMissed((m) => [...m, statement]);
    }
    setSt(next);
    setIndex(index + 1);
    if (next.wrong >= MAX_WRONG) end(next, 'wrong');
    else if (index + 1 >= run.length) end(next, 'out');
  };

  const addTime = () => {
    if (!spendCoins(EXTRA_TIME_COST)) return haptic.warning();
    haptic.tap();
    deadline.current += EXTRA_TIME_MS;
  };

  const skip = () => {
    if (!spendCoins(SKIP_COST)) return haptic.warning();
    haptic.tap();
    setIndex(index + 1);
    if (index + 1 >= run.length) end(st, 'out');
  };

  const continueRun = () =>
    ad.show(t('games.rewardContinue'), () => {
      setAdUsed(true);
      setSt((s) => ({ ...s, wrong: MAX_WRONG - 1 }));
      deadline.current = Date.now() + Math.max(remaining, 5000);
      setPhase('play');
    });

  const guard = useQuitGuard(phase === 'play' || phase === 'over', () => {
    if (daily) finish(st);
  });

  const statement = run[Math.min(index, run.length - 1)];
  const color = modeColors.blitz;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <TopBar
        left="close"
        onLeft={guard.close}
        title={t('games.blitz')}
        subtitle={daily ? t('games.daily') : t('games.practiceMode')}
        right={<CoinChip />}
      />

      {phase === 'ready' && (
        <Card style={{ gap: space.md }}>
          <Txt variant="title">{t('games.blitzReady')}</Txt>
          <Note>
            <Txt variant="small">{t('games.blitzRule1', { s: BLITZ_MS / 1000 })}</Txt>
            <Txt variant="small">{t('games.blitzRule2')}</Txt>
            <Txt variant="small">{t('games.blitzRule3', { n: MAX_WRONG, s: WRONG_PENALTY_MS / 1000 })}</Txt>
            <Txt variant="small">{t(daily ? 'games.blitzRuleDaily' : 'games.blitzRulePractice', { n: BLITZ_TARGET })}</Txt>
          </Note>
          <Button label={t('games.start')} icon="play" onPress={start} />
        </Card>
      )}

      {(phase === 'play' || phase === 'over') && (
        <>
          <View style={styles.stats}>
            <Pop trigger={st.score}>
              <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>
                {st.score} <Txt variant="small" tone="muted">{t('common.pts')}</Txt>
              </Txt>
            </Pop>
            <Txt variant="bodyStrong" tone={st.combo >= 5 ? 'gold' : 'muted'}>
              {t('games.combo', { n: st.combo, x: multiplierFor(st.combo) })}
            </Txt>
            <View style={styles.lives}>
              {Array.from({ length: MAX_WRONG }, (_, i) => (
                <Icon key={i} name={i < MAX_WRONG - st.wrong ? 'ellipse' : 'close-circle'} size={14} color={i < MAX_WRONG - st.wrong ? colors.text : colors.danger} />
              ))}
            </View>
          </View>
          <TimerBar remaining={remaining} limit={Math.max(BLITZ_MS, remaining)} stopped={phase !== 'play'} />
        </>
      )}

      {phase === 'play' && (
        <>
          <Shake trigger={st.wrong}>
            <SwipeCard key={statement.id} statement={statement} onAnswer={answer} flick={flick} />
          </Shake>
          <View style={styles.hints}>
            <SwipeHint pick={false} onPress={() => setFlick({ pick: false, id: statement.id })} />
            <Txt variant="tiny" tone="muted" center style={{ flex: 1 }}>
              {t('games.swipeHint')}
            </Txt>
            <SwipeHint pick onPress={() => setFlick({ pick: true, id: statement.id })} />
          </View>
          <View style={styles.answers}>
            <Button small kind="ghost" icon="time" label={t('games.addTime', { n: EXTRA_TIME_COST })} onPress={addTime} style={{ flex: 1 }} />
            <Button small kind="ghost" icon="play-skip-forward" label={t('games.skip', { n: SKIP_COST })} onPress={skip} style={{ flex: 1 }} />
          </View>
        </>
      )}

      {phase === 'over' && (
        <Card style={{ gap: space.md }}>
          <Txt variant="title">{t('games.blitzOut')}</Txt>
          <Txt tone="muted">{t('games.blitzContinueBody')}</Txt>
          <Button label={t('games.watchContinue')} kind="sponsor" icon="play-circle" onPress={continueRun} />
          <Button label={t('games.seeResult')} kind="secondary" onPress={() => finish(st)} />
        </Card>
      )}

      {phase === 'done' && (outcome || stored) && (
        <GameDone
          color={color}
          name={t('games.blitz')}
          day={day}
          daily={daily}
          points={outcome?.points ?? stored!.points}
          solved={outcome?.solved ?? stored!.solved}
          coins={outcome?.coins ?? stored!.coins}
          streak={daily ? (outcome?.streak ?? stored?.streakAfter) : undefined}
          grid={outcome?.grid ?? stored!.grid}
          shareLine={t('games.pointsLine', { n: outcome?.points ?? stored!.points })}
          onAgain={() => open.practice('blitz', { replace: true })}
        >
          {missed.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Txt variant="heading">{t('games.blitzMissed')}</Txt>
              {missed.map((m) => (
                <Card key={m.id} style={{ gap: space.xs }}>
                  {m.prompt && (
                    <Txt variant="small" tone="muted">
                      {L(m.prompt)}
                    </Txt>
                  )}
                  <Txt variant="bodyStrong">{L(m.text)}</Txt>
                  <Txt variant="small" tone={m.answer ? 'success' : 'danger'} style={{ fontWeight: '700' }}>
                    {m.answer ? t('games.true') : t('games.false')}
                  </Txt>
                  <Txt variant="small" tone="muted">
                    {L(m.why)}
                  </Txt>
                </Card>
              ))}
            </View>
          )}
        </GameDone>
      )}

      {guard.dialog}
      {ad.modal}
      {open.sheet}
    </Screen>
  );
}

/** On web, a mouse drag across the card would otherwise select its text. */
const NO_SELECT = (Platform.OS === 'web' ? { userSelect: 'none', cursor: 'grab' } : {}) as unknown as ViewStyle;

/** Drag the card this share of the screen width, or flick it, to answer. */
const SWIPE_SHARE = 0.3;
const FLICK_SPEED = 0.6;
const FLICK_MIN = 36;
const DRAG_SLOP = 8;

/** One statement. Throw it right for true, left for false. Remount it (new key) for the next one. */
function SwipeCard({
  statement,
  onAnswer,
  flick,
}: {
  statement: Statement;
  onAnswer: (pick: boolean) => void;
  /** Throw the card for this statement without a drag (a tap on a hint or an arrow key). */
  flick: { pick: boolean; id: string } | null;
}) {
  const { colors, shadow } = useTheme();
  const { t, L } = useT();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [drag] = useState(() => new Animated.Value(0));
  // The gesture handlers are made once; the controller keeps the latest props for them.
  const [swipe] = useState(() => createSwipe(drag));
  useEffect(() => {
    swipe.update({ onAnswer, width, reduced });
  });
  useEffect(() => {
    if (flick && flick.id === statement.id) swipe.fling(flick.pick);
  }, [flick, statement.id, swipe]);

  const rotate = drag.interpolate({ inputRange: [-width, 0, width], outputRange: ['-14deg', '0deg', '14deg'] });
  const trueOpacity = drag.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const falseOpacity = drag.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const trueTint = drag.interpolate({ inputRange: [0, width * SWIPE_SHARE], outputRange: [0, 1], extrapolate: 'clamp' });
  const falseTint = drag.interpolate({ inputRange: [-width * SWIPE_SHARE, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      {...swipe.responder.panHandlers}
      style={[
        styles.card,
        shadow.card,
        { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateX: drag }, { rotate }] },
        NO_SELECT,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.successSoft, opacity: trueTint }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.dangerSoft, opacity: falseTint }]} />
      <Animated.View style={[styles.stamp, styles.stampTrue, { borderColor: colors.success, opacity: trueOpacity }]}>
        <Txt variant="bodyStrong" tone="success">
          {t('games.true').toUpperCase()}
        </Txt>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.stampFalse, { borderColor: colors.danger, opacity: falseOpacity }]}>
        <Txt variant="bodyStrong" tone="danger">
          {t('games.false').toUpperCase()}
        </Txt>
      </Animated.View>
      {statement.prompt && (
        <Txt variant="body" tone="muted" center selectable={false}>
          {L(statement.prompt)}
        </Txt>
      )}
      <Txt variant="title" center selectable={false}>
        {L(statement.text)}
      </Txt>
    </Animated.View>
  );
}

/** "False" and "True" under the card: they show which way to swipe, and a tap works too. */
function SwipeHint({ pick, onPress }: { pick: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useT();
  const tint = pick ? colors.success : colors.danger;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pick ? t('games.true') : t('games.false')}
      onPress={onPress}
      style={({ pressed }) => [styles.hint, { borderColor: tint, opacity: pressed ? 0.7 : 1 }]}
    >
      {!pick && <Icon name="arrow-back" size={18} color={tint} />}
      <Txt variant="bodyStrong" style={{ color: tint }}>
        {pick ? t('games.true') : t('games.false')}
      </Txt>
      {pick && <Icon name="arrow-forward" size={18} color={tint} />}
    </Pressable>
  );
}

/** On web, a mouse drag starts a text selection before the card takes the gesture; drop it. */
function clearSelection() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges();
}

interface SwipeProps {
  onAnswer: (pick: boolean) => void;
  width: number;
  reduced: boolean;
}

/** The throw gesture, built once per card outside render so it can keep its own state. */
function createSwipe(drag: Animated.Value) {
  let props: SwipeProps = { onAnswer: () => {}, width: 0, reduced: false };
  let thrown = false;
  const settle = () => Animated.spring(drag, { toValue: 0, useNativeDriver: NATIVE_DRIVER, ...spring.settle }).start();

  /** Throw the card off to the right (true) or left (false), then answer. */
  const fling = (pick: boolean) => {
    if (thrown) return;
    thrown = true;
    if (props.reduced) return props.onAnswer(pick);
    Animated.timing(drag, {
      toValue: (pick ? 1 : -1) * props.width * 1.2,
      duration: duration.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      // Not finished means the card was removed first, e.g. the round ended.
      if (finished) props.onAnswer(pick);
    });
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => !thrown && Math.abs(g.dx) > DRAG_SLOP && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderMove: (_, g) => {
      clearSelection();
      drag.setValue(g.dx);
    },
    onPanResponderRelease: (_, g) => {
      clearSelection();
      const far = Math.abs(g.dx) > props.width * SWIPE_SHARE;
      const flick = Math.abs(g.vx) > FLICK_SPEED && Math.abs(g.dx) > FLICK_MIN && Math.sign(g.vx) === Math.sign(g.dx);
      if (!(far || flick)) return settle();
      fling(g.dx > 0);
    },
    onPanResponderTerminate: settle,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  return {
    responder,
    fling,
    update(next: SwipeProps) {
      props = next;
    },
  };
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  lives: { flexDirection: 'row', gap: 4 },
  answers: { flexDirection: 'row', gap: space.md },
  hints: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: 44,
  },
  card: {
    minHeight: 340,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: space.xl,
    gap: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: { position: 'absolute', top: space.lg, borderWidth: 2, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 2 },
  stampTrue: { left: space.lg },
  stampFalse: { right: space.lg },
});
