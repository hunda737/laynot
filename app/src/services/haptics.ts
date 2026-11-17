import * as Haptics from 'expo-haptics';

import { tgCall } from './telegram';

// Haptics are a nice-to-have: never let a failure (e.g. unsupported browser) reach the UI.
const safe = (run: () => Promise<void>) => {
  run().catch(() => {});
};

type Note = 'success' | 'error' | 'warning';

// Inside Telegram, expo-haptics does nothing (it is a web page), so use Telegram's own.
const tgSelection = () => {
  let used = false;
  tgCall('6.1', (app) => {
    app.HapticFeedback.selectionChanged();
    used = true;
  });
  return used;
};

const tgNote = (type: Note) => {
  let used = false;
  tgCall('6.1', (app) => {
    app.HapticFeedback.notificationOccurred(type);
    used = true;
  });
  return used;
};

export const haptic = {
  tap: () => tgSelection() || safe(() => Haptics.selectionAsync()),
  success: () => tgNote('success') || safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => tgNote('error') || safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  warning: () => tgNote('warning') || safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
