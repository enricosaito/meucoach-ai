import { useEffect, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

/**
 * Fades and slides (or pops) its children in on mount. Driven by shared values, so it behaves the
 * same on iOS, Android and web (layout "entering" animations are unreliable inside modals on web).
 */
export function Appear({
  children,
  delay = 0,
  variant = 'rise',
  style,
}: {
  children: ReactNode
  delay?: number
  variant?: 'rise' | 'pop'
  style?: StyleProp<ViewStyle>
}) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay,
      variant === 'pop'
        ? withSpring(1, { damping: 11, stiffness: 140 })
        : withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    )
  }, [delay, progress, variant])

  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.5),
    transform:
      variant === 'pop'
        ? [{ scale: 0.4 + 0.6 * progress.value }]
        : [{ translateY: 16 * (1 - progress.value) }],
  }))

  return <Animated.View style={[style, animated]}>{children}</Animated.View>
}
