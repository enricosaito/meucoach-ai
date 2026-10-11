import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from '@mycoach/core/coaching/contracts'
import { ArrowUp } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { font } from '../../lib/typography'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { ChatText } from './chat-text'
import { ShiningSparkles } from '../training/shining-sparkles'
import { Txt } from '../ui'

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
}: {
  message: ChatMessage
  showAvatar: boolean
  faded?: boolean
}) {
  const colors = useColors()
  const mine = message.role === 'user'
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
          // What the user typed stays exactly as typed.
          <Txt style={{ color: colors.onAccent }} selectable>
            {message.content}
          </Txt>
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

/** Message field with a round send button. */
export function Composer({
  onSend,
  disabled,
  autoFocus = false,
}: {
  onSend: (text: string) => void
  disabled: boolean
  autoFocus?: boolean
}) {
  const { t } = useI18n()
  const colors = useColors()
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0 && !disabled

  function send() {
    if (!canSend) return
    haptics.tap()
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <View
      style={[
        styles.composer,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <TextInput
        accessibilityLabel={t('coach.inputLabel')}
        placeholder={t('coach.placeholder')}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accentIcon}
        cursorColor={colors.accentIcon}
        value={draft}
        onChangeText={setDraft}
        maxLength={CHAT_MESSAGE_MAX_LENGTH}
        multiline
        autoFocus={autoFocus}
        style={[styles.input, { color: colors.textPrimary }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('coach.send')}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={send}
        style={({ pressed }) => [
          styles.send,
          {
            backgroundColor: canSend
              ? pressed
                ? colors.accentPressed
                : colors.accent
              : colors.surfaceMuted,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <ArrowUp
          size={20}
          strokeWidth={2.5}
          color={canSend ? colors.onAccent : colors.textDisabled}
        />
      </Pressable>
    </View>
  )
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: 26,
    padding: 6,
    paddingLeft: space.lg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    ...font('ui', 500),
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
