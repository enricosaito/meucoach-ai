import { Sparkles } from 'lucide-react-native'
import { useEffect } from 'react'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

/**
 * The AI coach's mark: sparkles that twinkle every few seconds (a quick grow, tilt and glow, then
 * rest). Stays still when the user prefers reduced motion.
 */
export function ShiningSparkles({ size, color }: { size: number; color: string }) {
  const reduceMotion = useReducedMotion()
  const twinkle = useSharedValue(0)

  useEffect(() => {
    if (reduceMotion) return
    const ease = Easing.inOut(Easing.quad)
    twinkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 280, easing: ease }),
        withTiming(0, { duration: 420, easing: ease }),
        withDelay(2200, withTiming(0, { duration: 0 })),
      ),
      -1,
    )
  }, [reduceMotion, twinkle])

  const animated = useAnimatedStyle(() => ({
    opacity: 0.75 + 0.25 * twinkle.value,
    transform: [
      { scale: 1 + 0.18 * twinkle.value },
      { rotate: `${String(12 * twinkle.value)}deg` },
    ],
  }))

  return (
    <Animated.View style={animated}>
      <Sparkles size={size} color={color} fill={color} />
    </Animated.View>
  )
}
