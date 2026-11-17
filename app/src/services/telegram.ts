import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { decodeStartParam, type StartTarget } from '@/lib/startParam';

/**
 * A thin, typed layer over the Telegram Mini App SDK (telegram-web-app.js, loaded in
 * public/index.html). Everything returns null or does nothing outside Telegram, so the
 * native app and the plain web build behave as before.
 * Reference: https://core.telegram.org/bots/webapps
 */

type Callback<T> = (error: string | null, result?: T) => void;

export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TgCloudStorage {
  setItem(key: string, value: string, callback?: Callback<boolean>): void;
  getItem(key: string, callback: Callback<string>): void;
  getItems(keys: string[], callback: Callback<Record<string, string>>): void;
  removeItem(key: string, callback?: Callback<boolean>): void;
}

export interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isVersionAtLeast(version: string): boolean;
  ready(): void;
  expand(): void;
  disableVerticalSwipes(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  openTelegramLink(url: string): void;
  onEvent(event: string, handler: () => void): void;
  offEvent(event: string, handler: () => void): void;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  HapticFeedback: {
    selectionChanged(): void;
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
  CloudStorage: TgCloudStorage;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

/** The Mini App SDK, or null when not running inside Telegram. */
export function tg(): TgWebApp | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const app = window.Telegram?.WebApp;
  // The SDK script also loads in a normal browser; only Telegram fills initData.
  return app && app.initData ? app : null;
}

export function isTelegram(): boolean {
  return tg() !== null;
}

/** Run an SDK call that needs at least `version`. Older clients warn or throw; never let that reach the UI. */
export function tgCall(version: string, run: (app: TgWebApp) => void): void {
  const app = tg();
  if (!app || !app.isVersionAtLeast(version)) return;
  try {
    run(app);
  } catch {
    // Unsupported on this client.
  }
}

let started = false;

/** Tell Telegram the app is ready, open it full height and stop swipe-down from closing it mid-quiz. */
export function initTelegram(): void {
  if (started) return;
  started = true;
  tgCall('6.0', (app) => {
    app.ready();
    app.expand();
  });
  tgCall('7.7', (app) => app.disableVerticalSwipes());
}

/** Match Telegram's header, background and bottom bar to the app's colours. */
export function setTelegramColors(bg: string, bar: string): void {
  tgCall('6.1', (app) => {
    app.setHeaderColor(bg);
    app.setBackgroundColor(bg);
  });
  tgCall('7.10', (app) => app.setBottomBarColor(bar));
}

export function telegramUser(): TgUser | null {
  return tg()?.initDataUnsafe.user ?? null;
}

/** The `startapp` value of the link that opened the app, if any. */
export function telegramStartParam(): string | null {
  return tg()?.initDataUnsafe.start_param ?? null;
}

const HANDLED_KEY = 'laynot-start-handled';

/**
 * The duel, league or room the launch link points at, given out once per session,
 * so a reload or a second visit to the start screen does not open it again.
 */
export function takeStartTarget(): StartTarget | null {
  const target = decodeStartParam(telegramStartParam());
  if (!target) return null;
  try {
    if (sessionStorage.getItem(HANDLED_KEY)) return null;
    sessionStorage.setItem(HANDLED_KEY, '1');
  } catch {
    // Without sessionStorage a reload may open the link again; harmless.
  }
  return target;
}

/** A display name in the style of the demo players: "Abel T.". */
export function telegramDisplayName(user: TgUser | null = telegramUser()): string {
  if (!user) return '';
  const first = user.first_name.trim();
  const initial = user.last_name?.trim().charAt(0);
  return (initial ? `${first} ${initial}.` : first).slice(0, 24);
}

/** Open Telegram's own chat picker with `message` ready to send. */
export function telegramShare(message: string): boolean {
  const app = tg();
  if (!app) return false;
  // The `url` field is placed in the draft as is, so the whole message goes there.
  // That keeps links and codes in the order the message already has.
  const url = `https://t.me/share/url?url=${encodeURIComponent(message)}`;
  try {
    app.openTelegramLink(url);
    return true;
  } catch {
    return false;
  }
}

const BOT = process.env.EXPO_PUBLIC_TG_BOT ?? '';
const APP = process.env.EXPO_PUBLIC_TG_APP ?? '';

/** `https://t.me/<bot>/<app>?startapp=<param>`, or null when the bot is not configured. */
export function miniAppLink(startParam?: string): string | null {
  if (!BOT || !APP) return null;
  const base = `https://t.me/${BOT}/${APP}`;
  return startParam ? `${base}?startapp=${startParam}` : base;
}

/** Telegram's light or dark mode, following changes; null outside Telegram. */
export function useTelegramScheme(): 'light' | 'dark' | null {
  return useSyncExternalStore(subscribeTheme, readScheme, readScheme);
}

function subscribeTheme(onChange: () => void): () => void {
  const app = tg();
  if (!app) return () => {};
  app.onEvent('themeChanged', onChange);
  return () => app.offEvent('themeChanged', onChange);
}

function readScheme(): 'light' | 'dark' | null {
  return tg()?.colorScheme ?? null;
}

/** While `active`, closing the Mini App asks the player to confirm first. */
export function useTelegramCloseGuard(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    tgCall('6.2', (app) => app.enableClosingConfirmation());
    return () => tgCall('6.2', (app) => app.disableClosingConfirmation());
  }, [active]);
}
