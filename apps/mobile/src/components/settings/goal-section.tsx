import { GOAL_TYPES, type Goals } from '@mycoach/core/profile/contracts'
import {
  Check,
  Dumbbell,
  HeartPulse,
  Scale,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { api, newIdempotencyKey, unwrap, writeHeaders } from '../../lib/api'
import { haptics } from '../../lib/haptics'
import { errorMessage, useI18n } from '../../lib/i18n'
import { useMe, type Me } from '../../lib/me'
import { radius, space, useColors } from '../../theme'
import { Card, ErrorText, Txt } from '../ui'

type Goal = NonNullable<Goals['primary']>

const GOAL_ICONS: Record<Goal, LucideIcon> = {
  lose_fat: TrendingDown,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_health: HeartPulse,
}

/** Main goal. Saves on tap (it drives calorie targets, the diet and the coach's advice). */
export function GoalSection({ profile }: { profile: Me['profile'] }) {
  const { t } = useI18n()
  const colors = useColors()
  const { setProfile } = useMe()
  const [pending, setPending] = useState<Goal | null>(null)
  const [error, setError] = useState('')
  const current = profile.goals.primary

  async function choose(goal: Goal) {
    if (goal === current || pending) return
    haptics.tap()
    setPending(goal)
    setError('')
    try {
      const result = await unwrap(
        api.me.profile.$patch(
          { json: { goals: { ...profile.goals, primary: goal } } },
          { headers: writeHeaders(newIdempotencyKey()) },
        ),
      )
      setProfile(result.profile)
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setPending(null)
    }
  }

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{t('settings.goalSection')}</Txt>
        <Txt variant="caption" muted>
          {t('profile.mainGoalHelp')}
        </Txt>
      </View>
      <View style={styles.grid}>
        {GOAL_TYPES.map((goal) => {
          const Icon = GOAL_ICONS[goal]
          const selected = (pending ?? current) === goal
          return (
            <Pressable
              key={goal}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void choose(goal)}
              style={[
                styles.tile,
                selected
                  ? { backgroundColor: colors.accentSoft, borderColor: colors.accent }
                  : { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={styles.tileTop}>
                <Icon size={20} color={selected ? colors.accent : colors.muted} />
                {selected && <Check size={16} color={colors.accent} strokeWidth={3} />}
              </View>
              <Txt variant="label" style={{ fontWeight: '600' }}>
                {t(`goals.${goal}.label`)}
              </Txt>
              <Txt variant="caption" muted>
                {t(`goals.${goal}.description`)}
              </Txt>
            </Pressable>
          )
        })}
      </View>
      <ErrorText>{error}</ErrorText>
    </Card>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '48.5%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
    gap: 4,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xs },
})
