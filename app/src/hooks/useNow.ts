import { useEffect, useState } from 'react';

import { DAY_MS, dayKey } from '@/lib/clock';
import { useGame } from '@/store/useGameStore';

/** Current time (including the demo day offset), refreshed every `tickMs`. */
export function useNow(tickMs = 1000): number {
  const offset = useGame((s) => s.dayOffset);
  const [real, setReal] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setReal(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return real + offset * DAY_MS;
}

/** Today's date key. Changes at local midnight and when the demo date moves. */
export function useToday(): string {
  return dayKey(useNow(15_000));
}
