import type { ChatMessage } from '@mycoach/core/coaching/contracts'
import type { MessageKey } from '@mycoach/i18n'
import { router, useFocusEffect } from 'expo-router'
import { ArrowRight, MessageCircle } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CoachAvatar } from '../../components/coach/chat-parts'
import { Knurling } from '../../components/knurling'
import { Button, Card, Screen, Txt } from '../../components/ui'
import { fetchChatHistory } from '../../lib/data'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'

const SUGGESTIONS: MessageKey[] = ['coach.suggestion1', 'coach.suggestion2', 'coach.suggestion3']
const PREVIEW = 3

function openChat(params?: { q?: string; focus?: '1' }) {
  router.push({ pathname: '/chat', params })
}

/**
 * The Coach tab: an entry point to the conversation. Asking (the bar, a suggestion) or
 * continuing opens the full-screen chat, where the keyboard has room.
 */
export default function CoachScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const [recent, setRecent] = useState<ChatMessage[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      fetchChatHistory(PREVIEW)
        .then(setRecent)
        .catch(() => {
          setRecent([])
        })
    }, []),
  )

  return (
    <Screen title={t('coach.title')}>
      <Card elevated style={styles.hero}>
        <Knurling color={colors.textPrimary} opacity={0.04} />
        <CoachAvatar size={56} />
        <Txt muted style={{ textAlign: 'center' }}>
          {t('coach.intro')}
        </Txt>
        {/* Looks like the composer; opens the chat with the keyboard up. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('coach.inputLabel')}
          onPress={() => {
            haptics.tap()
            openChat({ focus: '1' })
          }}
          style={({ pressed }) => [
            styles.askBar,
            {
              backgroundColor: colors.surface,
              borderColor: pressed ? colors.accentIcon : colors.border,
            },
          ]}
        >
          <Txt muted style={{ flex: 1 }} numberOfLines={1}>
            {t('coach.placeholder')}
          </Txt>
          <View style={[styles.askIcon, { backgroundColor: colors.accent }]}>
            <ArrowRight size={18} color={colors.onAccent} strokeWidth={2.5} />
          </View>
        </Pressable>
      </Card>

      <View style={{ gap: space.sm }}>
        <Txt variant="eyebrow" muted>
          {t('coach.suggestionsTitle')}
        </Txt>
        {SUGGESTIONS.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => {
              haptics.tap()
              openChat({ q: t(key) })
            }}
            style={({ pressed }) => [
              styles.suggestion,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <MessageCircle size={18} color={colors.accentIcon} />
            <Txt style={{ flex: 1 }}>{t(key)}</Txt>
          </Pressable>
        ))}
      </View>

      {recent && recent.length > 0 && (
        <Card style={{ gap: space.md }}>
          <Txt variant="heading">{t('coach.recent')}</Txt>
          {recent.map((m) => (
            <View key={m.id} style={styles.previewRow}>
              {m.role === 'assistant' ? (
                <CoachAvatar size={24} still />
              ) : (
                <View style={[styles.youDot, { backgroundColor: colors.accent }]} />
              )}
              <Txt
                variant="bodySmall"
                muted={m.role === 'user'}
                numberOfLines={2}
                style={{ flex: 1 }}
              >
                {m.content}
              </Txt>
            </View>
          ))}
          <Button
            variant="ghost"
            onPress={() => {
              openChat()
            }}
            trailingIcon={<ArrowRight size={16} color={colors.accentIcon} />}
          >
            {t('coach.continue')}
          </Button>
        </Card>
      )}

      <Txt variant="caption" muted style={{ textAlign: 'center' }}>
        {t('coach.aiNotice')}
      </Txt>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.lg, overflow: 'hidden', paddingVertical: space.xxl },
  askBar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingLeft: space.lg,
    padding: 6,
  },
  askIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  youDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7, marginHorizontal: 8 },
})
