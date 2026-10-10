import { nextStreakMilestone } from '@mycoach/core/gamification/contracts'
import { Link } from 'expo-router'
import { ArrowRight, Flame, MessageCircle, Trophy } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import type { Me } from '../../lib/me'
import { radius, space, useColors } from '../../theme'
import { Card, Txt } from '../ui'

/**
 * One rotating insight (Opal's story cards): the week's goal reached, the current streak, or a
 * nudge to ask the coach. Picks the most rewarding message that is true right now.
 */
export function StoryCard({
  me,
  trainedDays,
  target,
}: {
  me: Me
  trainedDays: number
  target: number | null
}) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  const streak = me.streak.current

  if (target !== null && trainedDays >= target) {
    return (
      <Story
        tint={colors.accentSoft}
        icon={<Trophy size={28} color={colors.accent} />}
        title={t('home.storyWeekDoneTitle')}
        body={t('home.storyWeekDoneBody', { count: formatNumber(target) })}
      />
    )
  }

  if (streak >= 2) {
    const next = nextStreakMilestone(streak)
    return (
      <Story
        tint={colors.energySoft}
        icon={<Flame size={28} color={colors.energy} fill={colors.energy} />}
        title={tc('home.storyStreakTitle', streak)}
        body={
          next ? t('home.storyStreakBody', { next: formatNumber(next) }) : t('celebrate.legend')
        }
      />
    )
  }

  return (
    <Story
      tint={colors.surface2}
      icon={<MessageCircle size={28} color={colors.accent} />}
      title={t('home.storyCoachTitle')}
      body={t('home.storyCoachBody')}
      action={
        <Link href="/coach" asChild>
          <Pressable style={styles.action} hitSlop={8}>
            <Txt variant="label" color="accent">
              {t('home.storyCoachCta')}
            </Txt>
            <ArrowRight size={16} color={colors.accent} />
          </Pressable>
        </Link>
      }
    />
  )
}

function Story({
  tint,
  icon,
  title,
  body,
  action,
}: {
  tint: string
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <Card style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
      <View style={{ flex: 1, gap: space.xs }}>
        <Txt variant="heading">{title}</Txt>
        <Txt muted>{body}</Txt>
        {action}
      </View>
      <View style={[styles.badge, { backgroundColor: tint }]}>{icon}</View>
    </Card>
  )
}

const styles = StyleSheet.create({
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.xs },
})
