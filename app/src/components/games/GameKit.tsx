import { usePreventRemove } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { dailyNumber, type DayKey } from '@/lib/clock';
import { haptic } from '@/services/haptics';
import { goBack } from '@/services/nav';
import { homeLink, shareMessage } from '@/services/share';
import { useTelegramCloseGuard } from '@/services/telegram';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { ConfirmDialog } from '../ConfirmDialog';
import { Confetti, PopIn, useCountUp } from '../motion';
import { CoinChip } from '../status';
import { Badge, Button, HeroCard, Txt } from '../ui';

/**
 * Asks before leaving a game mid-round: the close button, Android back, the swipe-back
 * gesture and (in Telegram) closing the Mini App. `onQuit` runs before the screen closes,
 * e.g. to record a daily puzzle as played.
 */
export function useQuitGuard(active: boolean, onQuit: () => void) {
  const { t } = useT();
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  usePreventRemove(active && !leaving, () => setAsking(true));
  useTelegramCloseGuard(active && !leaving);

  // Go back only once the guard above is off.
  useEffect(() => {
    if (leaving) goBack();
  }, [leaving]);

  const close = () => (active ? setAsking(true) : goBack());

  const dialog = (
    <ConfirmDialog
      visible={asking}
      title={t('games.quitTitle')}
      body={t('games.quitBody')}
      confirmLabel={t('quiz.quitConfirm')}
      cancelLabel={t('quiz.quitCancel')}
      destructive
      onConfirm={() => {
        setAsking(false);
        onQuit();
        setLeaving(true);
      }}
      onCancel={() => setAsking(false)}
    />
  );

  return { close, dialog };
}

/** The end of a round: score, coins, streak, the share grid and what to do next. */
export function GameDone({
  color,
  name,
  day,
  daily,
  points,
  solved,
  coins,
  streak,
  grid,
  shareLine,
  onAgain,
  children,
}: {
  color: string;
  /** The game's name, for the share card. */
  name: string;
  day: DayKey;
  daily: boolean;
  points: number;
  solved: boolean;
  coins: number;
  streak?: number;
  grid: string;
  /** A short summary for the share card, e.g. "3/6" or "180 pts". */
  shareLine: string;
  onAgain: () => void;
  /** The answer and anything else to show under the score. */
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const counted = useCountUp(shown ? points : 0, 700);

  const share = async () => {
    haptic.tap();
    const message = `${t('games.shareHead', { name, n: dailyNumber(day) })} · ${shareLine}\n${grid}`;
    const link = homeLink();
    await shareMessage(link ? `${message}\n${link}` : message);
  };

  return (
    <View style={{ gap: space.lg }}>
      <PopIn>
        <HeroCard color={color} align="center" watermark={solved ? 'trophy' : undefined}>
          <Txt variant="small" tone="onAccent" style={{ opacity: 0.9, fontWeight: '700' }}>
            {(solved ? t('games.solved') : t('games.notSolved')).toUpperCase()}
          </Txt>
          <Txt variant="number" tone="onAccent" style={styles.score} accessibilityLabel={`${points} ${t('result.points')}`}>
            {counted}
          </Txt>
          <Txt variant="bodyStrong" tone="onAccent" center style={{ opacity: 0.92 }}>
            {daily ? t('games.dailyPoints') : t('games.practicePoints')}
          </Txt>
          <Txt style={styles.grid} center>
            {grid}
          </Txt>
          <View style={styles.pills}>
            {streak !== undefined && streak > 0 && (
              <View style={[styles.pill, { backgroundColor: colors.onAccent }]}>
                <Badge icon="flame" label={t('result.streak', { n: streak })} bg={colors.onAccent} fg={color} />
              </View>
            )}
            {coins > 0 && <CoinChip amount={coins} prefix="+" variant="onColor" />}
            {!daily && solved && <Badge icon="heart" label={t('games.lifeBack')} bg={colors.onAccent} fg={color} />}
          </View>
        </HeroCard>
      </PopIn>

      {children}

      {daily && <Button label={t('result.share')} icon="share-social" onPress={share} />}
      <Button label={t('games.practiceCta')} kind={daily ? 'secondary' : 'primary'} icon="refresh" onPress={onAgain} />
      <Button label={t('games.back')} kind="ghost" icon="game-controller" onPress={goBack} />
      <Confetti fire={solved} />
    </View>
  );
}

/** A small rounded block of explanatory text, e.g. the rules before a round. */
export function Note({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.note, { backgroundColor: colors.surfaceAlt }]}>{children}</View>;
}

const styles = StyleSheet.create({
  score: { fontSize: 56, lineHeight: 62, fontVariant: ['tabular-nums'] },
  grid: { fontSize: 18, lineHeight: 24, letterSpacing: 1, marginVertical: space.xs },
  pills: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  pill: { borderRadius: radius.pill, padding: 4 },
  note: { borderRadius: radius.md, padding: space.md, gap: space.xs },
});
