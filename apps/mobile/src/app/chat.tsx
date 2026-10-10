import type { ChatMessage } from '@mycoach/core/coaching/contracts'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, RotateCw } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bubble, CoachAvatar, Composer, TypingIndicator } from '../components/coach/chat-parts'
import { Button, ErrorText, Skeleton, Txt } from '../components/ui'
import { api, newIdempotencyKey, unwrap, writeHeaders } from '../lib/api'
import { fetchChatHistory } from '../lib/data'
import { haptics } from '../lib/haptics'
import { errorMessage, useI18n } from '../lib/i18n'
import { space, useColors } from '../theme'

type Row =
  | { kind: 'message'; message: ChatMessage; showAvatar: boolean; faded?: boolean }
  | { kind: 'typing' }

/**
 * The coach conversation, full screen (no tab bar, so the composer can sit on the keyboard).
 * Opened from the Coach tab or "Perguntar para Meu Coach"; `?q=` sends a question right away.
 * History is read from Supabase (own rows); messages go through the API, which calls the AI.
 */
export default function ChatScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ q?: string; focus?: string }>()
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [loadError, setLoadError] = useState('')
  // The question in flight: kept until the reply arrives, so a retry resends the same body.
  const [sending, setSending] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  // One Idempotency-Key per question, reused on retry (the API replays a completed reply).
  const keyRef = useRef<string | null>(null)
  const startedFromParam = useRef(false)

  useEffect(() => {
    fetchChatHistory()
      .then(setMessages)
      .catch((e: unknown) => {
        setLoadError(errorMessage(t, e))
        setMessages([])
      })
  }, [t])

  async function deliver(question: string) {
    keyRef.current ??= newIdempotencyKey()
    setPending(true)
    setError('')
    try {
      const exchange = await unwrap(
        api.chat.messages.$post(
          { json: { content: question } },
          { headers: writeHeaders(keyRef.current) },
        ),
      )
      keyRef.current = null
      setMessages((current) => [...(current ?? []), exchange.question, exchange.reply])
      setSending('')
      haptics.tap()
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setPending(false)
    }
  }

  function ask(question: string) {
    if (!question || pending || sending) return
    keyRef.current = null
    setSending(question)
    void deliver(question)
  }

  // A question passed in (suggestion chip, Treino button): send it once history has loaded.
  useEffect(() => {
    const q = params.q?.trim()
    if (!q || startedFromParam.current || messages === null) return
    startedFromParam.current = true
    router.setParams({ q: undefined })
    ask(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when history is ready
  }, [params.q, messages])

  const failed = Boolean(error) && Boolean(sending) && !pending

  // Inverted list: newest first, so it starts at the bottom and follows new messages.
  const rows: Row[] = []
  if (pending) rows.push({ kind: 'typing' })
  if (sending) {
    rows.push({
      kind: 'message',
      message: { id: 'pending', role: 'user', content: sending, createdAt: '' },
      showAvatar: true,
      faded: failed,
    })
  }
  const list = messages ?? []
  for (let i = list.length - 1; i >= 0; i--) {
    const message = list[i]
    if (!message) continue
    rows.push({ kind: 'message', message, showAvatar: list[i - 1]?.role !== message.role })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={[styles.header, { paddingTop: insets.top + space.sm, borderColor: colors.border }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('wizard.back')}
          hitSlop={10}
          onPress={() => {
            router.back()
          }}
          style={styles.back}
        >
          <ChevronLeft size={26} color={colors.accentText} />
        </Pressable>
        <CoachAvatar size={36} />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{t('coach.title')}</Txt>
          <Txt variant="caption" muted numberOfLines={1}>
            {pending ? t('coach.typing') : t('coach.intro')}
          </Txt>
        </View>
      </View>

      {messages === null ? (
        <View style={styles.loading} accessibilityLabel={t('coach.loadingConversation')}>
          <Skeleton height={56} style={{ width: '70%' }} />
          <Skeleton height={40} style={{ width: '45%', alignSelf: 'flex-end' }} />
          <Skeleton height={88} style={{ width: '80%' }} />
        </View>
      ) : (
        <FlatList
          inverted
          data={rows}
          keyExtractor={(row) => (row.kind === 'typing' ? 'typing' : row.message.id)}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            item.kind === 'typing' ? (
              <TypingIndicator />
            ) : (
              <Bubble message={item.message} showAvatar={item.showAvatar} faded={item.faded} />
            )
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ErrorText>{loadError}</ErrorText>
              <Txt muted style={{ textAlign: 'center' }}>
                {t('coach.intro')}
              </Txt>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, space.md), borderColor: colors.border },
        ]}
      >
        {failed && (
          <View style={styles.retry}>
            <ErrorText>{error}</ErrorText>
            <Button
              variant="ghost"
              onPress={() => void deliver(sending)}
              icon={<RotateCw size={16} color={colors.accentIcon} />}
            >
              {t('common.tryAgain')}
            </Button>
          </View>
        )}
        <Composer
          onSend={ask}
          disabled={pending || Boolean(sending) || messages === null}
          autoFocus={params.focus === '1'}
        />
        <Txt variant="caption" muted style={{ textAlign: 'center' }}>
          {t('coach.aiNotice')}
        </Txt>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 32, alignItems: 'center' },
  loading: { flex: 1, padding: space.lg, gap: space.md },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  // Inverted list: flip the empty state back upright.
  empty: { flex: 1, justifyContent: 'center', gap: space.sm, transform: [{ scaleY: -1 }] },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  retry: { alignItems: 'flex-end', gap: space.xs },
})
