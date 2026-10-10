import { nextStreakMilestone, type Streak } from '@mycoach/core/gamification/contracts'
import { Check, Flame } from 'lucide-react-native'
import { useEffect } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haptics } from '../../lib/haptics'
import { Appear } from '../appear'
import { useI18n } from '../../lib/i18n'
import { space, useColors } from '../../theme'
import { Button, Txt } from '../ui'

const DOT = 36

/** Full-screen streak milestone moment (shown once per milestone day; see Home). */
export function StreakCelebration({ streak, onClose }: { streak: Streak; onClose: () => void }) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const { current, longest } = streak
  const next = nextStreakMilestone(current)

  useEffect(() => {
    haptics.success()
  }, [])

  // The last 7 days ending today; lit while inside the current run.
  const days = Array.from({ length: 7 }, (_, i) => 6 - i < current)
  const message =
    current === 1
      ? t('celebrate.first')
      : current >= longest && current > 7
        ? t('celebrate.legend')
        : next
          ? t('celebrate.next', { next: formatNumber(next) })
          : t('celebrate.legend')

  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <View style={styles.center}>
          <Appear variant="pop">
            <Flame size={120} color={colors.accent} fill={colors.accent} strokeWidth={1.5} />
          </Appear>
          <Appear delay={150} style={styles.center}>
            <Txt variant="displayXL" color="accentText" style={styles.number}>
              {formatNumber(current)}
            </Txt>
            <Txt variant="title">{tc('celebrate.days', current)}</Txt>
          </Appear>
          <Appear delay={300} style={styles.days}>
            {days.map((lit, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  lit
                    ? { backgroundColor: colors.accent }
                    : {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                ]}
              >
                {lit && <Check size={18} color={colors.onAccent} strokeWidth={3} />}
              </View>
            ))}
          </Appear>
          <Appear delay={400}>
            <Txt muted style={{ textAlign: 'center' }}>
              {message}
            </Txt>
          </Appear>
        </View>
        <Button onPress={onClose} style={{ alignSelf: 'stretch' }}>
          {t('celebrate.cta')}
        </Button>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: space.xxl, justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: space.lg },
  number: { fontSize: 96, lineHeight: 104, letterSpacing: -3 },
  days: { flexDirection: 'row', gap: space.sm },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
