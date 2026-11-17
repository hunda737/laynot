import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { TelegramBridge } from '@/components/TelegramBridge';
import { useHydrated } from '@/hooks/useHydrated';
import { initTelegram } from '@/services/telegram';
import { useTheme } from '@/theme/useTheme';

// Inside Telegram: open full height right away, while saved progress is still loading.
initTelegram();

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
      <TelegramBridge />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="daily/play" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="daily/result" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
