import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

export const Haptics = {
  impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (style === 'heavy') {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      } else if (style === 'medium') {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      } else {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  },
  notification: (type: 'success' | 'warning' | 'error' = 'success') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'warning') {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
      } else if (type === 'error') {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      } else {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      }
    } catch {}
  },
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      ExpoHaptics.selectionAsync();
    } catch {}
  }
};

export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
  if (type === 'success' || type === 'warning') {
    Haptics.notification(type);
  } else {
    Haptics.impact(type);
  }
};
