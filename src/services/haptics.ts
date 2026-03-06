import hapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

function trigger(type: Parameters<typeof hapticFeedback.trigger>[0]) {
  try {
    hapticFeedback.trigger(type, options);
  } catch {
    // Keep the app functional when running in tests or unsupported environments.
  }
}

export const haptics = {
  light: () => trigger('impactLight'),
  medium: () => trigger('impactMedium'),
  heavy: () => trigger('impactHeavy'),
  success: () => trigger('notificationSuccess'),
};
