import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Animations only touch transform and opacity, so they can run off the JS thread on phones. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

export const duration = { fast: 140, base: 240, slow: 420 } as const;

/** Delay between one item and the next in a staggered entrance. */
export const STAGGER_MS = 45;

export const spring = {
  /** Button and card press feedback: quick, no wobble. */
  press: { speed: 40, bounciness: 0 },
  /** A small overshoot for rewards and badges. */
  pop: { speed: 18, bounciness: 12 },
  /** Things that slide into place: the tab indicator, a released card. */
  settle: { speed: 16, bounciness: 6 },
} as const;

// One shared subscription to the OS "reduce motion" setting, however many components ask.
let reduced = false;
let started = false;
const listeners = new Set<() => void>();

function setReduced(next: boolean) {
  if (next === reduced) return;
  reduced = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (!started) {
    started = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
  }
  return () => {
    listeners.delete(notify);
  };
}

const getReduced = () => reduced;

/** True when the phone or browser asks for less motion. Entrances, loops and confetti switch off. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getReduced, getReduced);
}
