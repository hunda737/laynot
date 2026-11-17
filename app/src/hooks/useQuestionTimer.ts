import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts down from `limitMs` whenever `key` changes, while `running` is true.
 * Calls `onTimeout` once when time runs out.
 *
 * By default a pause does not stop the clock, so a dialog cannot buy thinking time.
 * With `holdOnPause`, time spent paused (e.g. watching a rewarded ad) is given back.
 */
export function useQuestionTimer(
  key: string,
  running: boolean,
  limitMs: number,
  onTimeout: () => void,
  { holdOnPause = false }: { holdOnPause?: boolean } = {},
) {
  const startedAt = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const [tick, setTick] = useState<{ key: string; left: number } | null>(null);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  });

  // Declared before the pause effect so a new question clears any old pause first.
  useEffect(() => {
    startedAt.current = Date.now();
    pausedAt.current = null;
  }, [key]);

  useEffect(() => {
    if (!holdOnPause) return;
    if (!running) pausedAt.current = Date.now();
    else if (pausedAt.current !== null) {
      startedAt.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }
  }, [running, holdOnPause]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, limitMs - (Date.now() - startedAt.current));
      setTick({ key, left });
      if (left <= 0) {
        clearInterval(id);
        timeoutRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [key, running, limitMs]);

  const remaining = tick?.key === key ? tick.left : limitMs;
  const elapsed = useCallback(() => Date.now() - startedAt.current, []);
  return { remaining, elapsed };
}
