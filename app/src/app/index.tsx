import { Redirect } from 'expo-router';

import { useGame } from '@/store/useGameStore';

export default function Index() {
  const onboarded = useGame((s) => s.onboarded);
  return <Redirect href={onboarded ? '/home' : '/welcome'} />;
}
