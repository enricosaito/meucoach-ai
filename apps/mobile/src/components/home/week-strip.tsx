import type { WeekDay } from '@mycoach/core/training/contracts'
import { Check } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { space, useColors } from '../../theme'
import { Card, Txt } from '../ui'

const DOT = 34

/** Monday to Sunday: trained days are filled with a check, today has a ring. */
export function WeekStrip({ days }: { days: WeekDay[] }) {
  const { t } = useI18n()
  const colors = useColors()
  const labels = t('home.weekdaysShort').split(',')

  return (
    <Card style={{ gap: space.md }}>
      <Txt variant="label" muted>
        {t('home.weekTitle')}
      </Txt>
      <View style={styles.row}>
        {days.map((day, i) => (
          <View key={day.date} style={styles.col}>
            <Txt
              variant="caption"
              style={{
                color: day.isToday ? colors.textPrimary : colors.textSecondary,
                fontWeight: day.isToday ? '700' : '400',
              }}
            >
              {labels[i] ?? ''}
            </Txt>
            <View
              accessibilityLabel={`${day.date}${day.trained ? ' ✓' : ''}`}
              style={[
                styles.dot,
                day.trained
                  ? { backgroundColor: colors.accent }
                  : {
                      backgroundColor: day.isFuture ? 'transparent' : colors.surfaceMuted,
                      borderWidth: day.isToday ? 2 : 1,
                      borderColor: day.isToday ? colors.accentIcon : colors.border,
                    },
              ]}
            >
              {day.trained && <Check size={16} color={colors.onAccent} strokeWidth={3} />}
            </View>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 6 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
