import { useLives } from '@/hooks/useEconomy';
import { formatCountdown } from '@/lib/clock';
import { useGame } from '@/store/useGameStore';
import { useTheme } from '@/theme/useTheme';
import { Pill } from './ui';

/** Hearts plus a countdown to the next life when not full. */
export function LivesPill({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  const { lives, nextAt, now } = useLives();
  const label = nextAt ? `${lives} · ${formatCountdown(nextAt - now)}` : String(lives);
  return <Pill icon="heart" label={label} color={colors.danger} bg={colors.dangerSoft} onPress={onPress} />;
}

export function CoinsPill() {
  const { colors } = useTheme();
  const coins = useGame((s) => s.coins);
  return <Pill icon="ellipse" label={String(coins)} color={colors.gold} bg={colors.goldSoft} />;
}
