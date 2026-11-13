import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useHydrated } from '@/hooks/useHydrated';
import { useTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const hydrated = useHydrated();
  const { colors, scheme } = useTheme();

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [scheme, colors]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="daily/play" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="daily/result" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
