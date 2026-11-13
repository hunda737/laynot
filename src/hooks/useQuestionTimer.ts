import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts down from `limitMs` whenever `key` changes, while `running` is true.
 * Calls `onTimeout` once when time runs out. Pausing does not stop the clock,
 * so a dialog cannot be used to buy extra thinking time.
 */
export function useQuestionTimer(key: string, running: boolean, limitMs: number, onTimeout: () => void) {
  const startedAt = useRef(0);
  const [tick, setTick] = useState<{ key: string; left: number } | null>(null);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, [key]);

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
