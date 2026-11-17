import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { encodeStartParam, START_PARAM_MAX, type StartKind } from '@/lib/startParam';
import { isTelegram, miniAppLink, telegramShare } from './telegram';

const KIND_BY_PATH: Record<'/duel/join' | '/league/join', StartKind> = { '/duel/join': 'duel', '/league/join': 'league' };

/**
 * A link that opens the app on a screen with the code filled in.
 * Inside Telegram it is a Mini App link (t.me/<bot>/<app>?startapp=...).
 * In Expo Go this only works for phones on the dev server's network;
 * the code in the same message works everywhere.
 */
export function appLink(path: '/duel/join' | '/league/join', code: string): string {
  if (isTelegram()) {
    const param = encodeStartParam({ kind: KIND_BY_PATH[path], code });
    const link = param.length <= START_PARAM_MAX ? miniAppLink(param) : miniAppLink();
    if (link) return link;
  }
  return Linking.createURL(path, { queryParams: { c: code } });
}

/** Inside Telegram, a link that opens the Mini App straight into a Live Room; null elsewhere. */
export function roomLink(code: string): string | null {
  return isTelegram() ? miniAppLink(encodeStartParam({ kind: 'room', code })) : null;
}

/** Inside Telegram, the link that opens the Mini App's home screen; null elsewhere. */
export function homeLink(): string | null {
  return isTelegram() ? miniAppLink() : null;
}

export async function shareMessage(message: string): Promise<void> {
  // Telegram's webview has no reliable share sheet; its chat picker does the job.
  if (telegramShare(message)) return;
  try {
    await Share.share({ message });
  } catch {
    // The share sheet was dismissed or is not available (some desktop browsers).
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
}

/** Empty string when the clipboard is empty or the browser refuses access. */
export async function pasteText(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch {
    return '';
  }
}
