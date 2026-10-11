import type { ChatMessage } from '@mycoach/core/coaching/contracts'
import { Image } from 'expo-image'
import { Camera, Mic } from 'lucide-react-native'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { chatPhotoUri } from '../../lib/chat-photos'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { ShiningSparkles } from '../training/shining-sparkles'
import { Txt } from '../ui'
import { ChatText } from './chat-text'

/** The coach's mark next to its messages: the twinkling sparkles on a soft orange disc. */
export function CoachAvatar({ size = 28, still = false }: { size?: number; still?: boolean }) {
  const colors = useColors()
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft },
      ]}
    >
      {still ? null : <ShiningSparkles size={size * 0.5} color={colors.accentIcon} />}
    </View>
  )
}

/**
 * One message. Yours: orange, right-aligned. The coach's: a calm surface on the left, with the
 * avatar on the first bubble of a run.
 */
export function Bubble({
  message,
  showAvatar,
  faded = false,
  photoUri,
}: {
  message: ChatMessage
  showAvatar: boolean
  faded?: boolean
  /** The photo to show for a message being sent (otherwise this phone's saved copy). */
  photoUri?: string | null
}) {
  const { t } = useI18n()
  const colors = useColors()
  const mine = message.role === 'user'
  const photo = message.hasImage ? (photoUri ?? chatPhotoUri(message.id)) : null
  return (
    <Appear style={[styles.row, mine ? styles.rowMine : styles.rowCoach]}>
      {!mine && (
        <View style={{ opacity: showAvatar ? 1 : 0 }}>
          <CoachAvatar still={!showAvatar} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          mine
            ? [styles.bubbleMine, { backgroundColor: colors.accent }]
            : [styles.bubbleCoach, { backgroundColor: colors.surface, borderColor: colors.border }],
          faded && { opacity: 0.5 },
        ]}
      >
        {mine ? (
          <View style={{ gap: space.sm }}>
            {message.hasImage &&
              (photo ? (
                <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
              ) : (
                // Photos aren't stored on the server; another phone has no copy.
                <View style={styles.meta}>
                  <Camera size={14} color={colors.onAccent} />
                  <Txt variant="caption" style={{ color: colors.onAccent }}>
                    {t('coach.photoSent')}
                  </Txt>
                </View>
              ))}
            {message.viaVoice && (
              <View style={styles.meta}>
                <Mic size={14} color={colors.onAccent} />
                <Txt variant="caption" style={{ color: colors.onAccent, fontWeight: '700' }}>
                  {t('coach.voiceNote')}
                </Txt>
              </View>
            )}
            {/* What the user typed (or said) stays exactly as it was. */}
            {message.content ? (
              <Txt style={{ color: colors.onAccent }} selectable>
                {message.content}
              </Txt>
            ) : null}
          </View>
        ) : (
          <ChatText content={message.content} color={colors.textPrimary} />
        )}
      </View>
    </Appear>
  )
}

/** Three dots while the coach writes (static when the user prefers reduced motion). */
export function TypingIndicator() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <View
      style={[styles.row, styles.rowCoach]}
      accessibilityLabel={t('coach.typing')}
      accessibilityLiveRegion="polite"
    >
      <CoachAvatar />
      <View
        style={[
          styles.bubble,
          styles.bubbleCoach,
          styles.typing,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TypingDots />
      </View>
    </View>
  )
}

/** The three animated dots on their own (inside a bubble or a card). */
export function TypingDots() {
  const colors = useColors()
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 150} color={colors.textSecondary} />
      ))}
    </View>
  )
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const reduceMotion = useReducedMotion()
  const lift = useSharedValue(0)
  useEffect(() => {
    if (reduceMotion) return
    lift.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
      ),
    )
  }, [delay, lift, reduceMotion])
  const animated = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * lift.value,
    transform: [{ translateY: -3 * lift.value }],
  }))
  return <Animated.View style={[styles.dot, { backgroundColor: color }, animated]} />
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  rowMine: { justifyContent: 'flex-end' },
  rowCoach: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg + 4,
  },
  bubbleMine: { borderBottomRightRadius: radius.xs },
  bubbleCoach: { borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: radius.xs },
  typing: { flexDirection: 'row', gap: 5, paddingVertical: space.lg },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  dots: { flexDirection: 'row', gap: 5 },
  photo: { width: 220, height: 220, borderRadius: radius.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
