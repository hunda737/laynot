import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { OutOfLivesSheet } from '@/components/OutOfLivesSheet';
import type { CategoryId } from '@/data/questions';
import { useLives } from './useEconomy';

/**
 * Opens a Topic Play round, or the out-of-lives sheet when there are no lives left.
 * A category tapped while out of lives opens by itself once a life comes back.
 * Render `sheet` once, anywhere on the screen.
 */
export function useOpenTopic(): {
  open: (id: CategoryId) => void;
  /** Show the out-of-lives sheet without picking a category. */
  showSheet: () => void;
  lives: number;
  sheet: ReactNode;
} {
  const { lives } = useLives();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<CategoryId | null>(null);

  const go = (id: CategoryId) => router.push({ pathname: '/topics/[category]', params: { category: id } });

  const open = (id: CategoryId) => {
    if (lives > 0) return go(id);
    setPending(id);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setPending(null);
  };

  const sheet = (
    <OutOfLivesSheet
      visible={visible}
      onClose={close}
      onLifeGained={() => {
        close();
        if (pending) go(pending);
      }}
    />
  );

  return { open, showSheet: () => setVisible(true), lives, sheet };
}
