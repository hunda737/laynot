import { useEffect, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { FlashCard as Card } from '@/data/flashcards';
import { useT, type StringKey } from '@/i18n';
import { duration, NATIVE_DRIVER, spring, useReducedMotion } from '@/theme/motion';
import { modeColors, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { DifficultyBadge } from './difficulty';
import { PressableScale } from './motion';
import { Badge, Icon, Txt } from './ui';

/** Drag the card this share of the screen width and letting go counts as an answer. */
const SWIPE_SHARE = 0.35;
/** A flick this fast (px per ms) counts too, once it has travelled `FLICK_MIN`. */
const FLICK_SPEED = 0.6;
const FLICK_MIN = 36;
/** A drag has to move this far, and mostly sideways, before the card takes it from the page scroll. */
const DRAG_SLOP = 8;

/**
 * A card that turns over on tap. Each face rotates through 90° and hides at the
 * halfway point, which works the same on Android and web without backface support.
 * Once it shows the answer it can be thrown: right for "got it", left for "missed it".
 * Remount it (with a new key) to start a new card face-down.
 */
export function FlashCard({
  card,
  flipped,
  onFlip,
  onSwipe,
  again,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  /** Called when the flipped card is thrown off the screen: `true` to the right, `false` to the left. */
  onSwipe?: (known: boolean) => void;
  again?: boolean;
}) {
  const { colors, cat } = useTheme();
  const { t, L } = useT();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [turn] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => new Animated.Value(0));

  // The gesture handlers are made once; the controller keeps the latest props for them.
  const [swipe] = useState(() => createSwipe(drag));
  useEffect(() => {
    swipe.update({ canSwipe: flipped && !!onSwipe, onSwipe, width, reduced });
  });

  useEffect(() => {
    if (reduced) {
      turn.setValue(flipped ? 1 : 0);
      return;
    }
    const anim = Animated.timing(turn, {
      toValue: flipped ? 1 : 0,
      duration: duration.slow,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [flipped, reduced, turn]);

  // A new card always starts in the middle, and a card on its way out stops when it is removed.
  useEffect(() => {
    swipe.reset();
    return () => drag.stopAnimation();
  }, [card.id, drag, swipe]);

  const frontStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] }),
    transform: [{ perspective: 1000 }, { rotateY: turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] }) }],
  };
  const backStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] }),
    transform: [{ perspective: 1000 }, { rotateY: turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] }) }],
  };

  // The card leans the way it is dragged, and the hint for that side grows until it would count.
  const limit = Math.max(1, width * SWIPE_SHARE);
  const span = Math.max(1, width);
  const tilt = reduced ? '0deg' : '9deg';
  const rotate = drag.interpolate({ inputRange: [-span, 0, span], outputRange: [`-${tilt}`, '0deg', tilt] });
  const toRight = drag.interpolate({ inputRange: [0, limit], outputRange: [0, 1], extrapolate: 'clamp' });
  const toLeft = drag.interpolate({ inputRange: [-limit, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const hint = (progress: Animated.AnimatedInterpolation<number>, color: string, icon: 'checkmark-circle' | 'close-circle', label: string) => (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.hint, { backgroundColor: color, opacity: progress, pointerEvents: 'none' }]}
    >
      <Animated.View
        style={[
          styles.hintBody,
          { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
        ]}
      >
        <Icon name={icon} size={52} color={colors.onAccent} />
        <Txt variant="title" tone="onAccent" center>
          {label}
        </Txt>
      </Animated.View>
    </Animated.View>
  );

  return (
    <Animated.View {...swipe.responder.panHandlers} style={{ transform: [{ translateX: drag }, { rotate }] }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={flipped ? L(card.back) : t('flash.tap')}
        onPress={flipped ? undefined : onFlip}
        scaleTo={flipped ? 1 : 0.98}
        style={styles.wrap}
      >
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: colors.surface, borderColor: colors.border, pointerEvents: flipped ? 'none' : 'auto' },
            frontStyle,
          ]}
        >
          <View style={styles.row}>
            <Txt variant="tiny" style={{ color: cat[card.topic].fg, flexShrink: 1 }} numberOfLines={1}>
              {t(`cat.${card.topic}` as StringKey).toUpperCase()}
            </Txt>
            <View style={styles.row}>
              {again && <Badge label={t('flash.again').toUpperCase()} icon="refresh" bg={colors.goldSoft} fg={colors.gold} />}
              <DifficultyBadge level={card.difficulty} />
            </View>
          </View>
          <View style={styles.main}>
            <Txt variant="question" center>
              {L(card.front)}
            </Txt>
          </View>
          <View style={[styles.row, { justifyContent: 'center' }]}>
            <Icon name="sync" size={16} color={colors.textMuted} />
            <Txt variant="small" tone="muted">
              {t('flash.tap')}
            </Txt>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.face,
            { backgroundColor: modeColors.flash, borderColor: modeColors.flash, pointerEvents: flipped ? 'auto' : 'none' },
            backStyle,
          ]}
        >
          <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
            <View style={[styles.shape, styles.shapeA]} />
            <View style={[styles.shape, styles.shapeB]} />
          </View>
          <Txt variant="tiny" tone="onAccent" style={{ opacity: 0.85 }}>
            {t('flash.answer').toUpperCase()}
          </Txt>
          <View style={[styles.main, { gap: space.md }]}>
            <Txt variant="title" tone="onAccent" center>
              {L(card.back)}
            </Txt>
            <Txt variant="small" tone="onAccent" center style={{ opacity: 0.9 }}>
              {L(card.fact)}
            </Txt>
          </View>
          {onSwipe ? (
            // Which way to throw the card. The buttons under it do the same job.
            <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.way}>
                <Icon name="arrow-back" size={14} color={colors.onAccent} />
                <Txt variant="small" tone="onAccent" numberOfLines={1} style={styles.wayText}>
                  {t('flash.missed')}
                </Txt>
              </View>
              <View style={styles.way}>
                <Txt variant="small" tone="onAccent" numberOfLines={1} style={styles.wayText}>
                  {t('flash.got')}
                </Txt>
                <Icon name="arrow-forward" size={14} color={colors.onAccent} />
              </View>
            </View>
          ) : null}
        </Animated.View>
      </PressableScale>

      {onSwipe ? (
        <>
          {hint(toRight, colors.successStrong, 'checkmark-circle', t('flash.got'))}
          {hint(toLeft, colors.dangerStrong, 'close-circle', t('flash.missed'))}
        </>
      ) : null}
    </Animated.View>
  );
}

interface SwipeProps {
  canSwipe: boolean;
  onSwipe?: (known: boolean) => void;
  width: number;
  reduced: boolean;
}

/**
 * The throw gesture. Built once per card component, outside render, so the handlers can keep
 * mutable state (where a drag started, whether the card is already flying) without a ref.
 */
function createSwipe(drag: Animated.Value) {
  let props: SwipeProps = { canSwipe: false, width: 0, reduced: false };
  let thrown = false;
  let from = 0;

  const settle = () => {
    if (props.reduced) drag.setValue(0);
    else Animated.spring(drag, { toValue: 0, useNativeDriver: NATIVE_DRIVER, ...spring.settle }).start();
  };

  const release = (moved: number, vx: number) => {
    const { onSwipe: done, width: w, reduced } = props;
    const dx = from + moved;
    const far = Math.abs(dx) > w * SWIPE_SHARE;
    const flick = Math.abs(vx) > FLICK_SPEED && Math.abs(dx) > FLICK_MIN && Math.sign(vx) === Math.sign(dx);
    if (!done || !(far || flick)) return settle();
    const known = dx > 0;
    thrown = true;
    if (reduced) {
      drag.setValue(0);
      done(known);
      return;
    }
    Animated.timing(drag, {
      toValue: (known ? 1 : -1) * w * 1.25,
      duration: duration.base,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      // Not finished means the card was removed first, e.g. by one of the buttons.
      if (finished) props.onSwipe?.(known);
    });
  };

  const responder = PanResponder.create({
    // Taps stay with the card (tap to flip) and up-and-down drags stay with the page.
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      props.canSwipe && !thrown && Math.abs(g.dx) > DRAG_SLOP && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    // A card caught on its way back carries on from where it was caught.
    onPanResponderGrant: () => {
      from = 0;
      drag.stopAnimation((at) => {
        from = at;
      });
    },
    onPanResponderMove: (_, g) => drag.setValue(from + g.dx),
    onPanResponderRelease: (_, g) => release(g.dx, g.vx),
    onPanResponderTerminate: settle,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  });

  return {
    responder,
    update(next: SwipeProps) {
      props = next;
    },
    reset() {
      thrown = false;
      from = 0;
      drag.setValue(0);
    },
  };
}

const styles = StyleSheet.create({
  wrap: { minHeight: 320 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: space.xl,
    gap: space.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  main: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  shape: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.1)' },
  shapeA: { width: 190, height: 190, borderRadius: 95, top: -80, right: -60 },
  shapeB: { width: 120, height: 120, borderRadius: 60, bottom: -50, left: -30 },
  way: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, opacity: 0.85 },
  wayText: { fontWeight: '700', flexShrink: 1 },
  hint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBody: { alignItems: 'center', gap: space.sm, padding: space.lg },
});
