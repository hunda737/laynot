import * as Haptics from 'expo-haptics';

// Haptics are a nice-to-have: never let a failure (e.g. unsupported browser) reach the UI.
const safe = (run: () => Promise<void>) => {
  run().catch(() => {});
};

export const haptic = {
  tap: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
