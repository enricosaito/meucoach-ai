import { Check } from 'lucide-react-native'
import { StyleSheet } from 'react-native'
import { useI18n } from '../lib/i18n'
import { radius, space, useColors } from '../theme'
import { Appear } from './appear'
import { Txt } from './ui'

/**
 * "Done today": a completed workout is a celebration, so it gets the bold orange fill (same size
 * as the button it replaces) and pops in.
 */
export function DoneBadge() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Appear variant="pop" style={[styles.badge, { backgroundColor: colors.accent }]}>
      <Check size={18} color={colors.onAccent} strokeWidth={3} />
      <Txt variant="label" style={{ color: colors.onAccent, fontSize: 16, fontWeight: '700' }}>
        {t('workout.doneToday')}
      </Txt>
    </Appear>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 56,
    borderRadius: radius.full,
  },
})
