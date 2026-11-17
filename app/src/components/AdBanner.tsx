import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Sponsor } from '@/data/sponsors';
import { useToday } from '@/hooks/useNow';
import { useT } from '@/i18n';
import { bannerSponsor, type AdPlacement } from '@/lib/ads';
import { useGame } from '@/store/useGameStore';
import { PINNED_AD_MIN_HEIGHT } from '@/theme/layout';
import { duration, NATIVE_DRIVER } from '@/theme/motion';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Badge, Icon, Txt } from './ui';

export const AD_BANNER_HEIGHT = 56;

/**
 * A small banner ad. `inline` is a rounded card that sits in the page;
 * `pinned` is a flat bar for the bottom of a quiz screen.
 *
 * The frame (size, "Ad" label, fade-in) is separate from the creative inside it,
 * so a real ad network's banner view can replace `DemoCreative` without touching any screen.
 * It has a fixed height from the first frame and never moves or takes touches, so it cannot
 * shift an answer button under someone's finger.
 */
export function AdBanner({
  placement,
  variant = 'inline',
  seed,
  exclude,
  style,
}: {
  placement: AdPlacement;
  variant?: 'inline' | 'pinned';
  seed?: string | number;
  /** A sponsor already shown on this screen. */
  exclude?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const enabled = useGame((s) => s.showBanners);
  const today = useToday();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: duration.slow, useNativeDriver: NATIVE_DRIVER }).start();
  }, [opacity]);

  if (!enabled) return null;
  const sponsor = bannerSponsor(placement, today, seed, exclude);

  return (
    <Animated.View
      accessible
      accessibilityLabel={t('ad.bannerLabel', { name: sponsor.name })}
      style={[
        styles.frame,
        variant === 'inline'
          ? { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }
          : { paddingHorizontal: space.lg },
        { opacity, pointerEvents: 'none' },
        style,
      ]}
    >
      <DemoCreative sponsor={sponsor} />
      <Badge label={t('ad.badge')} bg={colors.surfaceAlt} fg={colors.textMuted} />
    </Animated.View>
  );
}

/** The demo's stand-in for a network creative: one of the invented sponsors. */
function DemoCreative({ sponsor }: { sponsor: Sponsor }) {
  const { colors } = useTheme();
  const { L } = useT();
  return (
    <>
      <View style={[styles.logo, { backgroundColor: sponsor.color }]}>
        <Icon name={sponsor.icon} size={18} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="small" style={{ fontWeight: '800' }} numberOfLines={1}>
          {sponsor.name}
        </Txt>
        <Txt variant="small" tone="muted" numberOfLines={1}>
          {L(sponsor.tagline)}
        </Txt>
      </View>
    </>
  );
}

/**
 * The banner for a quiz screen. On tall phones it is pinned under the page (`footer`, for
 * `Screen`'s footer slot). On short phones a pinned bar would push the last answer off the
 * screen, so it goes at the very end of the page instead (`inline`). Only one is ever set.
 */
export function useQuizAd(
  placement: AdPlacement,
  { exclude, disabled }: { exclude?: string; disabled?: boolean } = {},
): { footer: ReactNode; inline: ReactNode } {
  const { height } = useWindowDimensions();
  const enabled = useGame((s) => s.showBanners);
  if (!enabled || disabled) return { footer: null, inline: null };
  return height >= PINNED_AD_MIN_HEIGHT
    ? { footer: <AdBanner placement={placement} variant="pinned" exclude={exclude} />, inline: null }
    : { footer: null, inline: <AdBanner placement={placement} exclude={exclude} /> };
}

const styles = StyleSheet.create({
  frame: {
    height: AD_BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  logo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
