import { Sparkles } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '../lib/i18n'
import type { XpFeedback } from '../lib/use-workout-log'
import { radius, space, useColors } from '../theme'
import { Appear } from './appear'
import { Txt } from './ui'

/** What logging a workout earned: XP pill plus a short message (level up wins). */
export function XpNote({ feedback }: { feedback: XpFeedback | null }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  if (!feedback) return null
  return (
    <Appear key={`${String(feedback.level)}-${String(feedback.awarded)}`} style={styles.row}>
      {feedback.awarded > 0 && (
        <View style={[styles.pill, { backgroundColor: colors.accent }]}>
          <Sparkles size={13} color={colors.accentFg} />
          <Txt variant="caption" style={{ color: colors.accentFg, fontWeight: '700' }}>
            {t('workout.xpEarned', { xp: formatNumber(feedback.awarded) })}
          </Txt>
        </View>
      )}
      <Txt variant="caption" style={{ flexShrink: 1 }}>
        {feedback.leveledUp
          ? t('workout.levelUp', { level: formatNumber(feedback.level) })
          : feedback.awarded > 0
            ? t('workout.logged')
            : t('workout.loggedNoXp')}
      </Txt>
    </Appear>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
})
