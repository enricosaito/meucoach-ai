import type { WorkoutSession } from '@mycoach/core/training/contracts'
import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Card, Txt } from '../ui'

const COLLAPSED = 5

/** Logged workouts from the last weeks (the hook loads 35 days), newest first. */
export function WorkoutHistory({
  sessions,
  todayDate,
}: {
  sessions: WorkoutSession[]
  todayDate: string
}) {
  const { t, formatDate } = useI18n()
  const colors = useColors()
  const [expanded, setExpanded] = useState(false)
  const sorted = [...sessions].sort(
    (a, b) => b.localDate.localeCompare(a.localDate) || b.createdAt.localeCompare(a.createdAt),
  )
  const shown = expanded ? sorted : sorted.slice(0, COLLAPSED)

  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{t('training.historyTitle')}</Txt>
        <Txt variant="caption" muted>
          {sorted.length ? t('training.historyBody') : t('training.historyEmpty')}
        </Txt>
      </View>
      {shown.map((session, i) => (
        <View
          key={session.id}
          style={[
            styles.row,
            i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
          ]}
        >
          <View style={[styles.check, { backgroundColor: colors.accentSoft }]}>
            <Check size={14} color={colors.accent} strokeWidth={3} />
          </View>
          <Txt numberOfLines={1} style={{ flex: 1, fontWeight: '500' }}>
            {session.dayTitle}
          </Txt>
          <Txt variant="caption" muted>
            {session.localDate === todayDate
              ? t('common.today')
              : // A local calendar day: format it at noon UTC so no time zone shifts the date.
                formatDate(`${session.localDate}T12:00:00Z`, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC',
                })}
          </Txt>
        </View>
      ))}
      {sorted.length > COLLAPSED && (
        <Pressable
          hitSlop={8}
          onPress={() => {
            haptics.tap()
            setExpanded((v) => !v)
          }}
        >
          <Txt variant="label" color="accent">
            {expanded ? t('training.showLess') : t('training.showMore')}
          </Txt>
        </Pressable>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  check: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
