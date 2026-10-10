import {
  planTotals,
  type DailyTargets,
  type DietPlanRecord,
} from '@mycoach/core/nutrition/contracts'
import { firstName, type Goals } from '@mycoach/core/profile/contracts'
import type { WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import type { MessageKey } from '@mycoach/i18n'
import { Link } from 'expo-router'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Salad,
  Scale,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Button, Card, Chip, ErrorText, Screen, Skeleton, Txt } from '../../components/ui'
import { fetchLatestPlan, fetchLatestReadyDietPlan, fetchLatestReadyPlan } from '../../lib/data'
import { useI18n } from '../../lib/i18n'
import { useMe, type Me } from '../../lib/me'
import { useWorkoutLog, type XpFeedback } from '../../lib/use-workout-log'
import { radius, space, useColors } from '../../theme'

const GOAL_ICONS: Record<NonNullable<Goals['primary']>, LucideIcon> = {
  lose_fat: TrendingDown,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_health: HeartPulse,
}

function greetingKey(date = new Date()): MessageKey {
  const hour = date.getHours()
  if (hour < 5) return 'greeting.evening'
  if (hour < 12) return 'greeting.morning'
  if (hour < 18) return 'greeting.afternoon'
  return 'greeting.evening'
}

interface Plans {
  latest: WorkoutPlanRecord | null
  ready: WorkoutPlanRecord | null
  diet: DietPlanRecord | null
}

export default function HomeScreen() {
  const { me, error, reload } = useMe()
  const [plans, setPlans] = useState<Plans | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlans = useCallback(async () => {
    const [latest, ready, diet] = await Promise.all([
      fetchLatestPlan(),
      fetchLatestReadyPlan(),
      fetchLatestReadyDietPlan(),
    ])
    setPlans({ latest, ready, diet })
  }, [])

  useEffect(() => {
    void loadPlans().catch(() => {
      setPlans({ latest: null, ready: null, diet: null })
    })
  }, [loadPlans])

  async function refresh() {
    setRefreshing(true)
    await Promise.allSettled([reload(), loadPlans()])
    setRefreshing(false)
  }

  if (error && !me) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
      </Screen>
    )
  }

  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      {me ? <HomeHeader me={me} /> : <Skeleton height={110} />}
      {plans && me ? (
        <>
          <TodayCard plans={plans} />
          {me.targets && <DietCard diet={plans.diet} />}
          {me.targets ? <TargetsCard targets={me.targets} /> : <EnergyTestCard />}
        </>
      ) : (
        <>
          <Skeleton height={200} />
          <Skeleton height={90} />
        </>
      )}
    </Screen>
  )
}

// ---------------------------------------------------------------------------
// Header: greeting + goal, streak and level chips
// ---------------------------------------------------------------------------

function HomeHeader({ me }: { me: Me }) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  const goal = me.profile.goals.primary
  const GoalIcon = goal ? GOAL_ICONS[goal] : Target
  const { current } = me.streak
  const { level, levelXp, levelSpan } = me.level
  const progress = levelSpan > 0 ? Math.min(1, levelXp / levelSpan) : 0

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingRight: 56 }}>
        <Txt muted>{t(greetingKey())},</Txt>
        <Txt variant="display" numberOfLines={1}>
          {firstName(me.profile)}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip style={{ flex: 1, minWidth: 0 }} icon={<GoalIcon size={16} color={colors.accent} />}>
          <Txt variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
            {goal ? t(`goals.${goal}.label`) : t('goals.setGoal')}
          </Txt>
        </Chip>
        <Chip
          icon={
            <Flame
              size={16}
              color={current > 0 ? colors.energy : colors.muted}
              fill={current > 1 ? colors.energy : 'transparent'}
            />
          }
        >
          <Txt variant="label">{tc('home.streakDays', current)}</Txt>
        </Chip>
        <Chip icon={<Star size={16} color={colors.accent} fill={colors.accent} />}>
          <Txt variant="label">{formatNumber(level)}</Txt>
          <View style={[styles.miniBar, { backgroundColor: colors.line }]}>
            <View
              style={{
                width: `${(progress * 100).toFixed(1)}%` as `${number}%`,
                height: '100%',
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </Chip>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Today's workout
// ---------------------------------------------------------------------------

function TodayCard({ plans }: { plans: Plans }) {
  const { t } = useI18n()
  const colors = useColors()
  const plan = plans.ready?.plan
  const generating = plans.latest?.status === 'pending' || plans.latest?.status === 'generating'

  return (
    <View style={[styles.hero, { backgroundColor: colors.fg }]}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Dumbbell size={16} color={colors.bg} style={{ opacity: 0.7 }} />
          <Txt variant="label" style={{ color: colors.bg, opacity: 0.7 }}>
            {plan ? t('workout.today') : t('training.homeCardTitle')}
          </Txt>
        </View>
        {plan && (
          <Link href="/training" asChild>
            <Pressable style={styles.row} hitSlop={8}>
              <Txt variant="label" style={{ color: colors.bg, opacity: 0.8 }}>
                {t('training.viewPlan')}
              </Txt>
              <ArrowRight size={16} color={colors.bg} style={{ opacity: 0.8 }} />
            </Pressable>
          </Link>
        )}
      </View>
      {plans.ready && plan ? (
        <TodayWorkout ready={plans.ready} />
      ) : (
        <Txt variant="title" style={{ color: colors.bg }}>
          {generating ? t('training.generatingTitle') : t('training.emptyTitle')}
        </Txt>
      )}
    </View>
  )
}

function TodayWorkout({ ready }: { ready: WorkoutPlanRecord }) {
  const { t, tc } = useI18n()
  const colors = useColors()
  const log = useWorkoutLog(ready)
  const days = ready.plan?.days ?? []

  if (log.loading || !log.today) return <Skeleton height={110} style={{ opacity: 0.2 }} />

  const { dayIndex, doneToday, thisWeek } = log.today
  const day = days[dayIndex]

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Txt variant="title" style={{ color: colors.bg }}>
          {day?.title}
        </Txt>
        <Txt variant="caption" style={{ color: colors.bg, opacity: 0.7 }}>
          {day?.focus} · {t('training.minutes', { count: day?.estimatedMinutes ?? 0 })}
        </Txt>
        {thisWeek > 0 && (
          <Txt variant="caption" style={{ color: colors.bg, opacity: 0.7 }}>
            {tc('workout.thisWeek', thisWeek)}
          </Txt>
        )}
      </View>
      {doneToday ? (
        <View style={[styles.doneBadge, { backgroundColor: colors.surface2 }]}>
          <Check size={16} color={colors.fg} strokeWidth={3} />
          <Txt variant="label">{t('workout.doneToday')}</Txt>
        </View>
      ) : (
        <Button
          onPress={() => void log.logDay(dayIndex)}
          loading={log.pendingDay === dayIndex}
          icon={<Check size={16} color={colors.accentFg} strokeWidth={3} />}
        >
          {t('workout.markDone')}
        </Button>
      )}
      <XpNote feedback={log.feedback} light />
      <ErrorText>{log.error}</ErrorText>
    </View>
  )
}

function XpNote({ feedback, light }: { feedback: XpFeedback | null; light?: boolean }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  if (!feedback) return null
  return (
    <View style={styles.row}>
      {feedback.awarded > 0 && (
        <View style={[styles.xpPill, { backgroundColor: colors.accent }]}>
          <Sparkles size={13} color={colors.accentFg} />
          <Txt variant="caption" style={{ color: colors.accentFg, fontWeight: '700' }}>
            {t('workout.xpEarned', { xp: formatNumber(feedback.awarded) })}
          </Txt>
        </View>
      )}
      <Txt variant="caption" style={{ color: light ? colors.bg : colors.fg, flexShrink: 1 }}>
        {feedback.leveledUp
          ? t('workout.levelUp', { level: formatNumber(feedback.level) })
          : feedback.awarded > 0
            ? t('workout.logged')
            : t('workout.loggedNoXp')}
      </Txt>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Diet and targets
// ---------------------------------------------------------------------------

function DietCard({ diet }: { diet: DietPlanRecord | null }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const plan = diet?.plan
  return (
    <Link href="/diet" asChild>
      <Pressable>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <View style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}>
            <Salad size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="caption" muted>
              {t('diet.homeCardTitle')}
            </Txt>
            <Txt variant="heading" numberOfLines={1}>
              {plan ? plan.name : t('diet.createPlan')}
            </Txt>
            <Txt variant="caption" muted>
              {plan
                ? t('diet.homeCardBody', {
                    meals: plan.meals.length,
                    kcal: formatNumber(planTotals(plan).kcal),
                  })
                : t('diet.homeEmptyBody')}
            </Txt>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </Card>
      </Pressable>
    </Link>
  )
}

const MACROS = [
  { key: 'proteinG', label: 'targets.protein', color: 'accent', kcal: 4 },
  { key: 'carbsG', label: 'targets.carbs', color: 'energy', kcal: 4 },
  { key: 'fatG', label: 'targets.fat', color: 'fat', kcal: 9 },
] as const

function TargetsCard({ targets }: { targets: DailyTargets }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  return (
    <Card>
      <View style={styles.row}>
        <Target size={16} color={colors.accent} />
        <Txt variant="label" muted>
          {t('targets.title')}
        </Txt>
      </View>
      <View style={[styles.row, { alignItems: 'baseline' }]}>
        <Txt style={{ fontSize: 44, fontWeight: '700', letterSpacing: -1 }}>
          {formatNumber(targets.kcal)}
        </Txt>
        <Txt muted>{t('common.kcalPerDay')}</Txt>
      </View>
      <View style={[styles.row, { gap: 4 }]}>
        {MACROS.map((m) => (
          <View
            key={m.key}
            style={{
              flex: (targets[m.key] * m.kcal) / targets.kcal,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors[m.color],
            }}
          />
        ))}
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        {MACROS.map((m) => (
          <View key={m.key} style={{ gap: 2 }}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: colors[m.color] }]} />
              <Txt variant="caption" muted>
                {t(m.label)}
              </Txt>
            </View>
            <Txt variant="heading">
              {t('common.grams', { value: formatNumber(targets[m.key]) })}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  )
}

function EnergyTestCard() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Card>
      <View style={[styles.iconTile, { backgroundColor: colors.energySoft }]}>
        <Flame size={24} color={colors.energy} />
      </View>
      <Txt variant="heading">{t('home.emptyTitle')}</Txt>
      <Txt muted>{t('home.emptyBody')}</Txt>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: space.lg },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: space.xl,
    borderRadius: radius.full,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  miniBar: { width: 24, height: 6, borderRadius: 3, overflow: 'hidden' },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
})
