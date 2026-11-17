import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Sponsor } from '@/data/sponsors';
import { useToday } from '@/hooks/useNow';
import { useT } from '@/i18n';
import { bannerSponsor, type AdPlacement } from '@/lib/ads';
import { useGame } from '@/store/useGameStore';
import { duration, NATIVE_DRIVER } from '@/theme/motion';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Badge, Icon, Txt } from './ui';

export const AD_BANNER_HEIGHT = 72;
export const AD_BANNER_HEIGHT_LARGE = 96;

/**
 * A banner ad: a rounded card that sits in the page. `large` is the bigger, sponsor-coloured
 * version used on the home page.
 *
 * The frame (size, "Ad" label, fade-in) is separate from the creative inside it,
 * so a real ad network's banner view can replace `DemoCreative` without touching any screen.
 * It has a fixed height from the first frame and never takes touches, so it cannot
 * shift an answer button under someone's finger.
 */
export function AdBanner({
  placement,
  size = 'regular',
  seed,
  exclude,
  style,
}: {
  placement: AdPlacement;
  size?: 'regular' | 'large';
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
  const large = size === 'large';

  return (
    <Animated.View
      accessible
      accessibilityLabel={t('ad.bannerLabel', { name: sponsor.name })}
      style={[
        styles.frame,
        {
          height: large ? AD_BANNER_HEIGHT_LARGE : AD_BANNER_HEIGHT,
          borderRadius: radius.md,
          borderWidth: large ? 2 : 1,
          borderColor: large ? sponsor.color : colors.border,
          backgroundColor: colors.surface,
          opacity,
          pointerEvents: 'none',
        },
        style,
      ]}
    >
      <DemoCreative sponsor={sponsor} large={large} />
      <Badge label={t('ad.badge')} bg={colors.surfaceAlt} fg={colors.textMuted} />
    </Animated.View>
  );
}

/** The demo's stand-in for a network creative: one of the invented sponsors. */
function DemoCreative({ sponsor, large }: { sponsor: Sponsor; large: boolean }) {
  const { colors } = useTheme();
  const { L } = useT();
  const logo = large ? 58 : 46;
  return (
    <>
      <View style={[styles.logo, { width: logo, height: logo, borderRadius: logo / 2, backgroundColor: sponsor.color }]}>
        <Icon name={sponsor.icon} size={large ? 28 : 22} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant={large ? 'heading' : 'bodyStrong'} numberOfLines={1}>
          {sponsor.name}
        </Txt>
        <Txt variant="small" tone="muted" numberOfLines={large ? 2 : 1}>
          {L(sponsor.tagline)}
        </Txt>
      </View>
    </>
  );
}

/**
 * The banner for a quiz screen, or null when banners are off or the screen opts out.
 * Screens place it inside `AnswerReveal`, so it shows up once an answer is picked.
 */
export function useQuizAd(placement: AdPlacement, { exclude, disabled }: { exclude?: string; disabled?: boolean } = {}): ReactNode {
  const enabled = useGame((s) => s.showBanners);
  if (!enabled || disabled) return null;
  return <AdBanner placement={placement} exclude={exclude} />;
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
  },
  logo: { alignItems: 'center', justifyContent: 'center' },
});
