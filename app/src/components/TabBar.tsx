import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { haptic } from '@/services/haptics';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme/layout';
import { NATIVE_DRIVER, spring, useReducedMotion } from '@/theme/motion';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { FadeInUp, PressableScale } from './motion';

const PAD = 8;
const MAX_SLOT = 104;

/**
 * The floating tab bar: a pill that hovers above the bottom edge. A dark capsule slides to
 * the active tab and shows its label; the other tabs are icons only.
 *
 * The props come from Expo Router's own tab navigator, which passes `emitter` and
 * `navigateToTab` rather than React Navigation's `navigation` object.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors, scheme, shadow } = useTheme();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const count = state.routes.length;
  const slot = Math.min(MAX_SLOT, (width - space.lg * 2 - PAD * 2) / Math.max(count, 1));
  const [x] = useState(() => new Animated.Value(state.index * slot));

  useEffect(() => {
    const toValue = state.index * slot;
    if (reduced) {
      x.setValue(toValue);
      return;
    }
    Animated.spring(x, { toValue, useNativeDriver: NATIVE_DRIVER, ...spring.settle }).start();
  }, [state.index, slot, reduced, x]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, TAB_BAR_GAP), pointerEvents: 'box-none' }]}>
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          shadow.float,
          {
            backgroundColor: scheme === 'dark' ? colors.surfaceAlt : colors.surface,
            borderColor: colors.border,
            borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Animated.View
          style={[styles.indicator, { width: slot, backgroundColor: colors.ink, transform: [{ translateX: x }] }]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
          const color = focused ? colors.onInk : colors.textMuted;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptic.tap();
              navigateToTab(route.key);
            }
          };

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              scaleTo={0.9}
              style={[styles.item, { width: slot }]}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              {focused && (
                <FadeInUp distance={0}>
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                    style={[typeScale.small, { color, fontWeight: '800' }]}
                  >
                    {label}
                  </Text>
                </FadeInUp>
              )}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: radius.pill,
    padding: PAD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: radius.pill },
  item: { height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
