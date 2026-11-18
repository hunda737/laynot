import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { OutOfLivesSheet } from '@/components/OutOfLivesSheet';
import { useGame } from '@/store/useGameStore';
import { useLives } from './useEconomy';

export type GameKind = 'blitz' | 'wordle' | 'groups' | 'player';

const PATHS = {
  blitz: '/games/blitz',
  wordle: '/games/wordle',
  groups: '/games/groups',
  player: '/games/player',
} as const;

interface Open {
  kind: GameKind;
  replace?: boolean;
}

function go({ kind, replace }: Open, mode: 'daily' | 'practice') {
  const href = { pathname: PATHS[kind], params: { mode } };
  if (replace) router.replace(href);
  else router.push(href);
}

/**
 * Opens a game. The daily puzzle is free. A practice puzzle stakes one life up front
 * (given back on a win), so with no lives left it shows the out-of-lives sheet instead,
 * and starts by itself once a life comes back. Render `sheet` once on the screen.
 */
export function useOpenGame(): {
  daily: (kind: GameKind) => void;
  practice: (kind: GameKind, opts?: { replace?: boolean }) => void;
  sheet: ReactNode;
} {
  const { lives } = useLives();
  const loseLife = useGame((s) => s.loseLife);
  const [pending, setPending] = useState<Open | null>(null);

  const start = (open: Open) => {
    loseLife();
    go(open, 'practice');
  };

  const practice = (kind: GameKind, opts?: { replace?: boolean }) => {
    const open = { kind, replace: opts?.replace };
    if (lives > 0) start(open);
    else setPending(open);
  };

  const sheet = (
    <OutOfLivesSheet
      visible={pending !== null}
      onClose={() => setPending(null)}
      onLifeGained={() => {
        const open = pending;
        setPending(null);
        if (open) start(open);
      }}
    />
  );

  return { daily: (kind) => go({ kind }, 'daily'), practice, sheet };
}
