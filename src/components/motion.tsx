import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { mulberry32 } from '@/lib/rng';
import { haptic } from '@/services/haptics';
import { duration, NATIVE_DRIVER, spring, STAGGER_MS, useReducedMotion } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A Pressable that springs down a little while held. The press feedback for the whole app. */
export function PressableScale({
  scaleTo = 0.97,
  tapHaptic,
  style,
  pressedStyle,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  scaleTo?: number;
  /** Give a light tap on press. */
  tapHaptic?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extra style while held, e.g. a darker background. */
  pressedStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const [pressed, setPressed] = useState(false);

  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: NATIVE_DRIVER, ...spring.press }).start();

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        to(1);
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (tapHaptic) haptic.tap();
        onPress?.(e);
      }}
      style={[style, pressed && pressedStyle, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Fades and rises into place once, on mount. Give list items an `index` to stagger them. */
export function FadeInUp({
  index = 0,
  delay = 0,
  distance = 12,
  style,
  children,
}: {
  index?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: duration.base + 80,
      delay: delay + index * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, progress, delay, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Scales in from small once, on mount: tiles, badges, chips arriving. */
export function PopIn({
  index = 0,
  delay = 0,
  style,
  children,
}: {
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay + index * STAGGER_MS),
      Animated.spring(progress, { toValue: 1, useNativeDriver: NATIVE_DRIVER, ...spring.pop }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduced, progress, delay, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A quick overshoot whenever `trigger` changes (not on mount): a coin gain, a new badge. */
export function Pop({
  trigger,
  style,
  children,
}: {
  trigger: unknown;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    scale.setValue(1.22);
    Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE_DRIVER, ...spring.pop }).start();
  }, [trigger, reduced, scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** A short sideways shake whenever `trigger` changes to something truthy (not on mount): a wrong answer, a bad code. */
export function Shake({
  trigger,
  style,
  children,
}: {
  trigger: unknown;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(0));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!trigger || reduced) return;
    const step = (toValue: number) =>
      Animated.timing(x, { toValue, duration: 55, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER });
    const anim = Animated.sequence([step(-8), step(8), step(-6), step(6), step(-3), step(0)]);
    anim.start();
    return () => anim.stop();
  }, [trigger, reduced, x]);

  return <Animated.View style={[style, { transform: [{ translateX: x }] }]}>{children}</Animated.View>;
}

/** A slow breathing loop while `active`: the at-risk streak ring, the last seconds of a timer. */
export function Pulse({
  active,
  to = 1.1,
  style,
  children,
}: {
  active: boolean;
  to?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!active || reduced) {
      scale.setValue(1);
      return;
    }
    const leg = (toValue: number) =>
      Animated.timing(scale, {
        toValue,
        duration: 620,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      });
    const loop = Animated.loop(Animated.sequence([leg(to), leg(1)]));
    loop.start();
    return () => loop.stop();
  }, [active, reduced, scale, to]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

/** A gentle up-and-down drift that never stops: decorative tiles on the welcome screen. */
export function Float({
  index = 0,
  distance = 5,
  style,
  children,
}: {
  index?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      y.setValue(0);
      return;
    }
    const leg = (toValue: number) =>
      Animated.timing(y, {
        toValue,
        duration: 1700 + (index % 4) * 260,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: NATIVE_DRIVER,
      });
    const loop = Animated.loop(Animated.sequence([leg(-distance), leg(distance)]));
    loop.start();
    return () => loop.stop();
  }, [reduced, y, index, distance]);

  return <Animated.View style={[style, { transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

/** Counts from the last value to the new one. Returns the number to show right now. */
export function useCountUp(value: number, ms: number = duration.slow * 2): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (reduced || start === value) {
      setShown(value);
      return;
    }
    const driver = new Animated.Value(0);
    const id = driver.addListener(({ value: p }) => setShown(Math.round(start + (value - start) * p)));
    const anim = Animated.timing(driver, {
      toValue: 1,
      duration: ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(() => setShown(value));
    return () => {
      anim.stop();
      driver.removeListener(id);
    };
  }, [value, ms, reduced]);

  return shown;
}

const CONFETTI_COLORS = ['#E5432A', '#F5C24C', '#1D4ED8', '#15803D', '#BE185D', '#7E22CE'];
const CONFETTI_COUNT = 24;

interface Piece {
  left: number;
  drift: number;
  size: number;
  color: string;
  delay: number;
  spin: number;
  round: boolean;
}

/**
 * A single burst of falling paper. Lay it over a screen; it never takes touches.
 * It plays each time `fire` changes to something truthy.
 */
export function Confetti({ fire }: { fire: unknown }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [fall] = useState(() => new Animated.Value(0));
  const [pieces] = useState<Piece[]>(() => {
    const rand = mulberry32(20261114);
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      left: rand(),
      drift: (rand() - 0.5) * 120,
      size: 7 + Math.round(rand() * 6),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: rand() * 0.25,
      spin: (rand() > 0.5 ? 1 : -1) * (360 + rand() * 540),
      round: i % 3 === 0,
    }));
  });

  useEffect(() => {
    if (!fire || reduced) return;
    fall.setValue(0);
    const anim = Animated.timing(fall, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [fire, reduced, fall]);

  // Pieces wait above the top edge before the burst and fade to nothing after it.
  if (!fire || reduced) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.confetti]}>
      {pieces.map((p, i) => {
        const start = p.delay;
        const local = fall.interpolate({ inputRange: [start, 1], outputRange: [0, 1], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: -20,
              left: p.left * width,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: local.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: local.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.85] }) },
                { translateX: local.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: local.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  confetti: { pointerEvents: 'none', overflow: 'hidden', zIndex: 10 },
});
