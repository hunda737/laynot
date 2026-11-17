import { useSyncExternalStore } from 'react';

import { useGame } from '@/store/useGameStore';

const subscribe = (onChange: () => void) => useGame.persist.onFinishHydration(onChange);
const getSnapshot = () => useGame.persist.hasHydrated();

/** False until saved data has been read from the phone. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
