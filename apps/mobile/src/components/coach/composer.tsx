import { CHAT_MESSAGE_MAX_LENGTH } from '@mycoach/core/coaching/contracts'
import { Image } from 'expo-image'
import { ArrowUp, Camera, Mic, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { pickBodyPhoto } from '../../lib/body-photos'
import { prepareChatPhoto, type ChatPhoto } from '../../lib/chat-photos'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { choosePhotoSource } from '../../lib/photo-source'
import { font } from '../../lib/typography'
import { useVoiceRecorder, VOICE_LIMIT_MS, type VoiceNote } from '../../lib/use-voice-recorder'
import { radius, space, useColors } from '../../theme'
import { ErrorText, Txt } from '../ui'

function clock(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60))}:${String(total % 60).padStart(2, '0')}`
}

/**
 * The chat composer, WhatsApp-style: the round button is a mic until there's something to send
 * (text or a photo), then it becomes send. Tapping the mic records a voice note (tap ➤ to send,
 * ✕ to discard; it sends itself at the 2-minute limit).
 */
export function Composer({
  onSend,
  onVoice,
  disabled,
  autoFocus = false,
}: {
  onSend: (message: { text: string; photo: ChatPhoto | null }) => void
  onVoice: (note: VoiceNote) => void
  disabled: boolean
  autoFocus?: boolean
}) {
  const { t } = useI18n()
  const colors = useColors()
  const voice = useVoiceRecorder()
  const [draft, setDraft] = useState('')
  const [photo, setPhoto] = useState<ChatPhoto | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState('')
  const sendingVoice = useRef(false)

  const hasContent = draft.trim().length > 0 || photo !== null
  const canSend = hasContent && !disabled && !preparing

  function send() {
    if (!canSend) return
    haptics.tap()
    onSend({ text: draft.trim(), photo })
    setDraft('')
    setPhoto(null)
  }

  function attach() {
    haptics.tap()
    choosePhotoSource(
      {
        title: t('coach.photoTitle'),
        camera: t('wizard.takePhoto'),
        library: t('wizard.choosePhoto'),
        cancel: t('common.cancel'),
      },
      (source) => {
        void (async () => {
          const asset = await pickBodyPhoto(source)
          if (!asset) return
          setPreparing(true)
          setError('')
          try {
            setPhoto(await prepareChatPhoto(asset))
          } catch {
            setError(t('wizard.photoTooLarge'))
          } finally {
            setPreparing(false)
          }
        })()
      },
    )
  }

  async function startRecording() {
    haptics.tap()
    setError('')
    const started = await voice.start().catch(() => false)
    if (started) return
    if (Platform.OS === 'web') setError(t('coach.micDenied'))
    else Alert.alert(t('coach.recordVoice'), t('coach.micDenied'))
  }

  async function sendVoice() {
    if (sendingVoice.current) return
    sendingVoice.current = true
    try {
      const note = await voice.stop()
      if (note) {
        haptics.success()
        onVoice(note)
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      sendingVoice.current = false
    }
  }

  // The 2-minute limit sends the note rather than losing it.
  useEffect(() => {
    if (voice.isRecording && voice.durationMs >= VOICE_LIMIT_MS) void sendVoice()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the clock only
  }, [voice.isRecording, voice.durationMs])

  const box = [styles.box, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]

  if (voice.isRecording) {
    return (
      <View style={[box, styles.row]}>
        <RoundButton
          label={t('coach.cancelRecording')}
          onPress={() => {
            haptics.tap()
            void voice.cancel()
          }}
          background={colors.surfaceMuted}
        >
          <X size={20} color={colors.textPrimary} />
        </RoundButton>
        <View style={styles.recording} accessibilityLiveRegion="polite">
          <RecordingDot color={colors.accent} />
          <Txt variant="label" style={{ fontWeight: '600' }}>
            {t('coach.recording')}
          </Txt>
          <Txt variant="label" muted tabularNums>
            {clock(voice.durationMs)} / {clock(VOICE_LIMIT_MS)}
          </Txt>
        </View>
        <RoundButton
          label={t('coach.sendVoice')}
          onPress={() => void sendVoice()}
          background={colors.accent}
        >
          <ArrowUp size={20} strokeWidth={2.5} color={colors.onAccent} />
        </RoundButton>
      </View>
    )
  }

  return (
    <View style={{ gap: space.xs }}>
      <View style={box}>
        {photo && (
          <View style={styles.preview}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('coach.removePhoto')}
              hitSlop={6}
              onPress={() => {
                haptics.tap()
                setPhoto(null)
              }}
              style={[styles.removeThumb, { backgroundColor: colors.overlay }]}
            >
              <X size={12} color={colors.onOverlay} />
            </Pressable>
          </View>
        )}
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('coach.attachPhoto')}
            disabled={disabled || preparing}
            hitSlop={6}
            onPress={attach}
            style={styles.attach}
          >
            {preparing ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Camera size={22} color={colors.textSecondary} />
            )}
          </Pressable>
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
          {hasContent ? (
            <RoundButton
              label={t('coach.send')}
              onPress={send}
              disabled={!canSend}
              background={canSend ? colors.accent : colors.surfaceMuted}
            >
              <ArrowUp
                size={20}
                strokeWidth={2.5}
                color={canSend ? colors.onAccent : colors.textDisabled}
              />
            </RoundButton>
          ) : (
            <RoundButton
              label={t('coach.recordVoice')}
              onPress={() => void startRecording()}
              disabled={disabled}
              background={colors.accent}
            >
              <Mic size={20} strokeWidth={2.25} color={colors.onAccent} />
            </RoundButton>
          )}
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
    </View>
  )
}

function RoundButton({
  label,
  onPress,
  disabled = false,
  background,
  children,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  background: string
  children: React.ReactNode
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: background, opacity: disabled ? 0.5 : 1 },
        { transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  )
}

/** A softly pulsing dot while recording (still with reduced motion). */
function RecordingDot({ color }: { color: string }) {
  const reduceMotion = useReducedMotion()
  const pulse = useSharedValue(1)
  useEffect(() => {
    if (reduceMotion) return
    pulse.value = withRepeat(withTiming(0.35, { duration: 700 }), -1, true)
  }, [pulse, reduceMotion])
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }))
  return <Animated.View style={[styles.dot, { backgroundColor: color }, animated]} />
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 26, padding: 6, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs },
  attach: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    ...font('ui', 500),
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    paddingHorizontal: space.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  preview: { alignSelf: 'flex-start', marginLeft: space.xs, marginTop: space.xs },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  removeThumb: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
