import type { CheckIn } from '@mycoach/core/coaching/contracts'
import { router } from 'expo-router'
import { ArrowRight, RotateCw } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { CoachAvatar, TypingDots } from '../coach/chat-parts'
import { ChatText } from '../coach/chat-text'
import { Knurling } from '../knurling'
import { Button, Card, ErrorText, Txt } from '../ui'

function openChat(params?: { q?: string; focus?: '1' }) {
  router.push({ pathname: '/chat', params })
}

/**
 * Home's hero: today's message from the coach, written for this user (yesterday's workout, an
 * injury they mentioned, getting back after a break…), with one-tap replies. Answering opens the
 * chat, where the check-in is the latest message, so the conversation simply continues.
 */
export function CoachCheckInCard({
  checkIn,
  error,
  onRetry,
}: {
  checkIn: CheckIn | null
  error: string
  onRetry: () => void
}) {
  const { t } = useI18n()
  const colors = useColors()

  return (
    <Card elevated style={styles.card}>
      <Knurling color={colors.textPrimary} opacity={0.035} />
      <View style={styles.header}>
        <CoachAvatar size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="label" style={{ fontWeight: '700' }}>
            {t('coach.title')}
          </Txt>
          <Txt variant="caption" muted>
            {checkIn ? t('common.today') : t('coach.typing')}
          </Txt>
        </View>
      </View>

      {checkIn ? (
        <Appear style={{ gap: space.lg }}>
          <ChatText content={checkIn.message.content} color={colors.textPrimary} />
          {checkIn.quickReplies.length > 0 && (
            <View style={styles.replies}>
              {checkIn.quickReplies.map((reply) => (
                <Pressable
                  key={reply}
                  accessibilityRole="button"
                  onPress={() => {
                    haptics.tap()
                    openChat({ q: reply })
                  }}
                  style={({ pressed }) => [
                    styles.reply,
                    {
                      backgroundColor: pressed ? colors.accentSoft : colors.surface,
                      borderColor: colors.accentIcon,
                    },
                  ]}
                >
                  <Txt variant="label" color="accentText" style={{ fontWeight: '700' }}>
                    {reply}
                  </Txt>
                </Pressable>
              ))}
            </View>
          )}
        </Appear>
      ) : error ? (
        <View style={{ gap: space.sm }}>
          <ErrorText>{t('home.checkInError')}</ErrorText>
          <Button
            variant="ghost"
            onPress={onRetry}
            icon={<RotateCw size={16} color={colors.accentIcon} />}
          >
            {t('common.tryAgain')}
          </Button>
        </View>
      ) : (
        <View style={styles.typing} accessibilityLabel={t('coach.typing')}>
          <TypingDots />
        </View>
      )}

      {/* Looks like the chat composer; opens the chat with the keyboard up. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.replyToCoach')}
        onPress={() => {
          haptics.tap()
          openChat({ focus: '1' })
        }}
        style={({ pressed }) => [
          styles.replyBar,
          {
            backgroundColor: colors.surface,
            borderColor: pressed ? colors.accentIcon : colors.border,
          },
        ]}
      >
        <Txt muted style={{ flex: 1 }} numberOfLines={1}>
          {t('home.replyToCoach')}
        </Txt>
        <View style={[styles.send, { backgroundColor: colors.accent }]}>
          <ArrowRight size={18} color={colors.onAccent} strokeWidth={2.5} />
        </View>
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { gap: space.lg, overflow: 'hidden', paddingVertical: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  typing: { paddingVertical: space.md },
  replies: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  reply: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingLeft: space.lg,
    padding: 6,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
