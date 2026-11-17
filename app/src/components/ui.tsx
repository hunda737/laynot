import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { goBack } from '@/services/nav';
import { useTabBarSpace } from '@/theme/layout';
import { duration, NATIVE_DRIVER, useReducedMotion } from '@/theme/motion';
import { radius, space, type as typeScale, type Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from './motion';

export type IconName = IoniconsIconName;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: ColorValue }) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.text} />;
}

type Variant = keyof typeof typeScale;
type Tone = 'text' | 'muted' | 'primary' | 'success' | 'danger' | 'gold' | 'sponsor' | 'onPrimary' | 'onAccent';

const toneColor = (colors: Palette, tone: Tone) =>
  ({
    text: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    gold: colors.gold,
    sponsor: colors.sponsor,
    onPrimary: colors.onPrimary,
    onAccent: colors.onAccent,
  })[tone];

export function Txt({
  variant = 'body',
  tone = 'text',
  center,
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone; center?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        typeScale[variant] as TextStyle,
        { color: toneColor(colors, tone) },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

export function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  footer,
  tabBarInset,
  scrollY,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned below the scrolling content. It owns the bottom safe area. */
  footer?: ReactNode;
  /** For tab screens: leave room for the floating tab bar. */
  tabBarInset?: boolean;
  /** Receives the scroll offset, for scroll-linked effects. */
  scrollY?: Animated.Value;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const safeEdges = footer ? edges.filter((e) => e !== 'bottom') : edges;
  const inner = [
    styles.screenContent,
    tabBarInset && !footer && { paddingBottom: tabSpace + space.lg },
    contentStyle,
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={safeEdges}>
      {scroll ? (
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={
            scrollY
              ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })
              : undefined
          }
        >
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            paddingBottom: tabBarInset ? tabSpace : insets.bottom,
          }}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'sponsor' | 'ink';

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const palette: Record<ButtonKind, { bg: string; pressed: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary },
    secondary: { bg: colors.surface, pressed: colors.surfaceAlt, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', pressed: colors.surfaceAlt, fg: colors.text },
    inverse: { bg: colors.onAccent, pressed: colors.primarySoft, fg: colors.primaryStrong },
    sponsor: { bg: colors.sponsorStrong, pressed: colors.sponsorStrong, fg: colors.onAccent },
    ink: { bg: colors.ink, pressed: colors.inkPressed, fg: colors.onInk },
  };
  const p = palette[kind];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.96}
      style={[
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent', opacity: disabled ? 0.45 : 1 },
        style,
      ]}
      pressedStyle={{ backgroundColor: p.pressed }}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={small ? 16 : 20} color={p.fg} />}
          <Text style={[small ? typeScale.small : typeScale.bodyStrong, { color: p.fg, fontWeight: '700' }]}>
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { colors, shadow } = useTheme();
  const base = [styles.card, shadow.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} style={base} scaleTo={0.98}>
      {children}
    </PressableScale>
  );
}

/** A small label chip: "NEW", "Ad", "2 your turn". */
export function Badge({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && <Icon name={icon} size={11} color={fg} />}
      <Text style={[typeScale.tiny, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      scaleTo={0.9}
      style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      pressedStyle={{ backgroundColor: colors.surfaceAlt }}
    >
      <Icon name={icon} size={20} color={color ?? colors.text} />
    </PressableScale>
  );
}

/** The row at the top of every stack screen: back or close, a title (or anything), and a right slot. */
export function TopBar({
  left = 'back',
  onLeft = goBack,
  title,
  subtitle,
  center,
  right,
}: {
  left?: 'back' | 'close' | 'none';
  onLeft?: () => void;
  title?: string;
  subtitle?: string;
  /** Replaces the title, e.g. progress dots. */
  center?: ReactNode;
  right?: ReactNode;
}) {
  const { t } = useT();
  return (
    <View style={styles.header}>
      {left !== 'none' && (
        <IconButton
          icon={left === 'close' ? 'close' : 'chevron-back'}
          onPress={onLeft}
          label={t(left === 'close' ? 'common.close' : 'common.back')}
        />
      )}
      {center ?? (
        <View style={{ flex: 1 }}>
          <Txt variant="heading" numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="small" tone="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
      )}
      {right}
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Txt variant="heading" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Txt>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Txt variant="small" tone="muted" style={{ fontWeight: '700' }}>
            {actionLabel}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

/** A rounded track with a fill that slides to its new value. */
export function ProgressBar({
  value,
  max = 1,
  color,
  trackColor,
  height = 8,
  animated = true,
  durationMs = duration.slow,
  linear,
  style,
}: {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
  height?: number;
  animated?: boolean;
  durationMs?: number;
  /** Constant speed, for timers. */
  linear?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const [fill] = useState(() => new Animated.Value(animated ? 0 : ratio));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!animated || reduced) {
      fill.setValue(ratio);
      return;
    }
    const anim = Animated.timing(fill, {
      toValue: ratio,
      duration: durationMs,
      easing: linear ? Easing.linear : Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [ratio, animated, reduced, durationMs, linear, fill]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        { height, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: trackColor ?? colors.surfaceAlt },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: color ?? colors.primary,
          opacity: width > 0 ? 1 : 0,
          transform: [{ translateX: fill.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
        }}
      />
    </View>
  );
}

/**
 * A filled colour block with soft decorative circles: the Daily card, result headers, mode tiles.
 * Everything inside should use the `onAccent` tone.
 */
export function HeroCard({
  color,
  pattern = 'circles',
  watermark,
  align = 'start',
  onPress,
  scrollY,
  style,
  children,
}: {
  color: string;
  pattern?: 'circles' | 'rings' | 'none';
  /** A large faint icon in the bottom-right corner. */
  watermark?: IconName;
  align?: 'start' | 'center';
  onPress?: () => void;
  /** Scroll offset: the decoration drifts a little as the page scrolls. */
  scrollY?: Animated.Value;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { scheme } = useTheme();
  const drift = (factor: number) =>
    scrollY ? [{ translateY: Animated.multiply(scrollY, factor) }] : undefined;
  const ring = pattern === 'rings';
  const shape = (extra: ViewStyle) =>
    ring
      ? [styles.heroShape, { borderWidth: 14, borderColor: 'rgba(255,255,255,0.13)' }, extra]
      : [styles.heroShape, { backgroundColor: 'rgba(255,255,255,0.12)' }, extra];

  const body = (
    <>
      {pattern !== 'none' && (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          <Animated.View
            style={[shape({ width: 180, height: 180, borderRadius: 90, top: -70, right: -50 }), { transform: drift(0.12) }]}
          />
          <Animated.View
            style={[shape({ width: 110, height: 110, borderRadius: 55, bottom: -45, right: 60 }), { transform: drift(-0.08) }]}
          />
          <Animated.View
            style={[shape({ width: 64, height: 64, borderRadius: 32, top: 24, right: 96 }), { transform: drift(0.2) }]}
          />
        </View>
      )}
      {watermark && (
        <View style={[styles.heroWatermark, { pointerEvents: 'none' }]}>
          <Icon name={watermark} size={120} color="rgba(255,255,255,0.18)" />
        </View>
      )}
      <View style={[styles.heroBody, align === 'center' && { alignItems: 'center' }]}>{children}</View>
    </>
  );

  const base = [
    styles.hero,
    { backgroundColor: color },
    scheme === 'dark' && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    style,
  ];
  if (!onPress) return <View style={base}>{body}</View>;
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} style={base} scaleTo={0.98} pressedStyle={{ opacity: 0.94 }}>
      {body}
    </PressableScale>
  );
}

/** A number with a label and a tinted icon: profile stats, result summaries. */
export function StatTile({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  onPress,
  style,
}: {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card onPress={onPress} style={[styles.statTile, style]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Txt variant="title" numberOfLines={1} adjustsFontSizeToFit style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Txt>
      <Txt variant="small" tone="muted" numberOfLines={2}>
        {label}
      </Txt>
    </Card>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && [{ backgroundColor: colors.surface, borderColor: colors.border }, shadow.card]]}
          >
            <Text
              style={[typeScale.small, { color: active ? colors.text : colors.textMuted, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  screenContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: space.lg, borderRadius: radius.sm },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, gap: space.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hero: { borderRadius: radius.xl, overflow: 'hidden' },
  heroBody: { padding: space.xl, gap: space.sm },
  heroShape: { position: 'absolute' },
  heroWatermark: { position: 'absolute', right: -14, bottom: -22 },
  statTile: { flexBasis: '46%', flexGrow: 1, gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
