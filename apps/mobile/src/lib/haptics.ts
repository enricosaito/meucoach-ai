import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// Tactile feedback for key moments. No-ops on web, where there is no haptic engine.
const enabled = Platform.OS !== 'web'

export const haptics = {
  /** A light tap: buttons and selections. */
  tap: () => {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  },
  /** Something worth celebrating: a logged workout, a streak milestone. */
  success: () => {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  },
}
