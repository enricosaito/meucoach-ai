import { router } from 'expo-router'
import { Flame, Star } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import type { Me } from '../../lib/me'
import { radius, space, useColors } from '../../theme'
import { ProgressRing } from '../progress-ring'
import { Card, Txt } from '../ui'

/**
 * The week at a glance, compact (the coach is Home's hero now): workouts done against the plan,
 * the app streak and the level. Without a plan it links to Treino.
 */
export function WeekSummary({
  me,
  trainedDays,
  target,
}: {
  me: Me
  trainedDays: number
  /** Workouts per week in the plan; null without a plan. */
  target: number | null
}) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  const complete = target !== null && trainedDays >= target
  const { level, levelXp, levelSpan } = me.level

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        router.push('/training')
      }}
    >
      <Card style={styles.card}>
        <ProgressRing
          size={64}
          stroke={6}
          progress={target ? trainedDays / target : 0}
          color={colors.accentIcon}
          trackColor={colors.border}
        >
          <Txt variant="number" style={styles.ringNumber}>
            {target
              ? t('home.weekGoal', {
                  done: formatNumber(trainedDays),
                  target: formatNumber(target),
                })
              : '—'}
          </Txt>
        </ProgressRing>

        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="label" style={{ fontWeight: '700' }} numberOfLines={2}>
            {target === null
              ? t('home.noPlanHero')
              : complete
                ? t('home.weekComplete')
                : tc('home.workoutsThisWeek', target)}
          </Txt>
          <View style={styles.stats}>
            <Stat
              icon={
                <Flame
                  size={14}
                  color={me.streak.current > 0 ? colors.accentIcon : colors.textSecondary}
                  fill={me.streak.current > 1 ? colors.accentIcon : 'transparent'}
                />
              }
              label={`${formatNumber(me.streak.current)} · ${t('home.streakLabel')}`}
            />
            <Stat
              icon={
                <ProgressRing
                  size={16}
                  stroke={2.5}
                  progress={levelSpan > 0 ? levelXp / levelSpan : 0}
                  color={colors.accentIcon}
                  trackColor={colors.border}
                >
                  <Star size={7} color={colors.accentIcon} fill={colors.accentIcon} />
                </ProgressRing>
              }
              label={`${t('home.levelLabel')} ${formatNumber(level)}`}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  )
}

function Stat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Txt variant="caption" muted tabularNums>
        {label}
      </Txt>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
  ringNumber: { fontSize: 14, lineHeight: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full },
})
