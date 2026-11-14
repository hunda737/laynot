import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { FlashCard as Card } from '@/data/flashcards';
import { useT, type StringKey } from '@/i18n';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { DifficultyBadge } from './difficulty';
import { Icon, Txt } from './ui';

const native = Platform.OS !== 'web';

/**
 * A card that turns over on tap. Each face rotates through 90° and hides at the
 * halfway point, which works the same on Android and web without backface support.
 * Remount it (with a new key) to start a new card face-down.
 */
export function FlashCard({ card, flipped, onFlip, again }: { card: Card; flipped: boolean; onFlip: () => void; again?: boolean }) {
  const { colors } = useTheme();
  const { t, L } = useT();
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(turn, { toValue: flipped ? 1 : 0, duration: 380, useNativeDriver: native }).start();
  }, [flipped, turn]);

  const frontStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] }),
    transform: [{ perspective: 1000 }, { rotateY: turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] }) }],
  };
  const backStyle = {
    opacity: turn.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] }),
    transform: [{ perspective: 1000 }, { rotateY: turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] }) }],
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={flipped ? L(card.back) : t('flash.tap')}
      onPress={flipped ? undefined : onFlip}
      style={styles.wrap}
    >
      <Animated.View
        pointerEvents={flipped ? 'none' : 'auto'}
        style={[styles.face, { backgroundColor: colors.surface, borderColor: colors.border }, frontStyle]}
      >
        <View style={styles.row}>
          <Txt variant="tiny" tone="primary">
            {t(`cat.${card.topic}` as StringKey).toUpperCase()}
          </Txt>
          <View style={styles.row}>
            {again && (
              <View style={[styles.again, { backgroundColor: colors.goldSoft }]}>
                <Txt variant="tiny" tone="gold">
                  {t('flash.again').toUpperCase()}
                </Txt>
              </View>
            )}
            <DifficultyBadge level={card.difficulty} />
          </View>
        </View>
        <View style={styles.main}>
          <Txt variant="question" center>
            {L(card.front)}
          </Txt>
        </View>
        <View style={[styles.row, { justifyContent: 'center' }]}>
          <Icon name="sync" size={16} color={colors.textMuted} />
          <Txt variant="small" tone="muted">
            {t('flash.tap')}
          </Txt>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.face, styles.back, { backgroundColor: colors.sponsorSoft, borderColor: colors.sponsor }, backStyle]}
      >
        <Txt variant="tiny" tone="sponsor">
          {t('flash.answer').toUpperCase()}
        </Txt>
        <View style={[styles.main, { flexGrow: 0 }]}>
          <Txt variant="title" center>
            {L(card.back)}
          </Txt>
        </View>
        <Txt variant="small" tone="muted" center>
          {L(card.fact)}
        </Txt>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 300 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: space.xl,
    gap: space.md,
    justifyContent: 'space-between',
  },
  back: { justifyContent: 'center' },
  main: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  again: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
});
