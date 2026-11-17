import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { progressSnapshot } from '@/lib/progress';
import { reportProgress } from '@/services/backend';
import { goBack } from '@/services/nav';
import { isTelegram, setTelegramColors, telegramDisplayName, telegramUser, tgCall } from '@/services/telegram';
import { todayKey, useGame } from '@/store/useGameStore';
import { useTheme } from '@/theme/useTheme';

/** Screens with nowhere to go back to: Telegram's back button stays hidden on them. */
const ROOTS = new Set(['/', '/home', '/ranks', '/profile', '/welcome']);

/**
 * Connects the app to the Telegram Mini App around it: native back button, matching
 * header colours and first-launch language. Launch links are opened by the index route.
 * Renders nothing, and does nothing outside Telegram.
 */
export function TelegramBridge() {
  if (!isTelegram()) return null;
  return <Bridge />;
}

function Bridge() {
  const pathname = usePathname();
  const { colors } = useTheme();

  useEffect(() => {
    pickLanguage();
  }, []);

  useEffect(() => startReporting(), []);

  useEffect(() => {
    setTelegramColors(colors.bg, colors.surface);
  }, [colors.bg, colors.surface]);

  useEffect(() => {
    if (ROOTS.has(pathname)) {
      tgCall('6.1', (app) => app.BackButton.hide());
      return;
    }
    const onBack = () => goBack();
    tgCall('6.1', (app) => {
      app.BackButton.onClick(onBack);
      app.BackButton.show();
    });
    return () => tgCall('6.1', (app) => app.BackButton.offClick(onBack));
  }, [pathname]);

  return null;
}

/** A new player whose Telegram is in Amharic starts in Amharic. */
function pickLanguage() {
  const { onboarded, setLanguage } = useGame.getState();
  if (!onboarded && telegramUser()?.language_code === 'am') setLanguage('am');
}

const REPORT_DELAY_MS = 2000;

/**
 * Tell the bot's server how the player is doing: once when the app opens, and again a moment
 * after the streak, today's result or the profile name changes. The server uses it to remind
 * people who have not played and to build the weekly board.
 */
function startReporting(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const send = () => {
    const state = useGame.getState();
    // getTimezoneOffset is minutes WEST of UTC; the server wants minutes east.
    void reportProgress(progressSnapshot(state, todayKey(), -new Date().getTimezoneOffset(), telegramDisplayName()));
  };
  send();
  const unsubscribe = useGame.subscribe((state, prev) => {
    if (state.streak === prev.streak && state.dailyHistory === prev.dailyHistory && state.profile === prev.profile) return;
    clearTimeout(timer);
    timer = setTimeout(send, REPORT_DELAY_MS);
  });
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
