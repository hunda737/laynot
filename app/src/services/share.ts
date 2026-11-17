import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';

/**
 * A link that opens the app on a screen with the code filled in.
 * In Expo Go this only works for phones on the dev server's network;
 * the code in the same message works everywhere.
 */
export function appLink(path: '/duel/join' | '/league/join', code: string): string {
  return Linking.createURL(path, { queryParams: { c: code } });
}

export async function shareMessage(message: string): Promise<void> {
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
