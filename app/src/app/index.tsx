import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import type { StartTarget } from '@/lib/startParam';
import { takeStartTarget } from '@/services/telegram';
import { useGame } from '@/store/useGameStore';

export default function Index() {
  const onboarded = useGame((s) => s.onboarded);
  const markOnboarded = useGame((s) => s.markOnboarded);
  // Opened from a Telegram link to a duel, league or room: go straight there.
  const [target] = useState(takeStartTarget);

  // A friend's link skips the welcome tour; they can still sign up later.
  useEffect(() => {
    if (target && !onboarded) markOnboarded();
  }, [target, onboarded, markOnboarded]);

  if (target) return <Redirect href={startHref(target)} />;
  return <Redirect href={onboarded ? '/home' : '/welcome'} />;
}

function startHref(target: StartTarget): Href {
  if (target.kind === 'duel') return { pathname: '/duel/join', params: { c: target.code } };
  if (target.kind === 'league') return { pathname: '/league/join', params: { c: target.code } };
  return { pathname: '/live/[code]', params: { code: target.code, mode: 'join' } };
}
