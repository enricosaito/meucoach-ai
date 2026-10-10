import AsyncStorage from '@react-native-async-storage/async-storage'
import { isStreakMilestone } from '@mycoach/core/gamification/contracts'
import { planTotals, type DietPlanRecord } from '@mycoach/core/nutrition/contracts'
import { firstName } from '@mycoach/core/profile/contracts'
import { weekProgress, type WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import type { MessageKey } from '@mycoach/i18n'
import { Link, useFocusEffect } from 'expo-router'
import { ArrowRight, Check, ChevronRight, Dumbbell, Flame, Salad } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { DoneBadge } from '../../components/done-badge'
import { MacroTiles } from '../../components/home/macro-tiles'
import { StoryCard } from '../../components/home/story-card'
import { StreakCelebration } from '../../components/home/streak-celebration'
import { WeekHero } from '../../components/home/week-hero'
import { WeekStrip } from '../../components/home/week-strip'
import { XpNote } from '../../components/xp-note'
import {
  Button,
  Card,
  ErrorText,
  ProfileAvatarLink,
  Screen,
  Skeleton,
  Txt,
} from '../../components/ui'
import { fetchLatestPlan, fetchLatestReadyDietPlan, fetchLatestReadyPlan } from '../../lib/data'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useMe, type Me } from '../../lib/me'
import { useWorkoutLog } from '../../lib/use-workout-log'
import { workoutTitle } from '../../lib/workout-names'
import { radius, space, useColors } from '../../theme'

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
  const log = useWorkoutLog(plans?.ready ?? null)

  const loadPlans = useCallback(async () => {
    const [latest, ready, diet] = await Promise.all([
      fetchLatestPlan(),
      fetchLatestReadyPlan(),
      fetchLatestReadyDietPlan(),
    ])
    setPlans({ latest, ready, diet })
  }, [])

  // Reload whenever Home comes into view: a plan or workout may have changed on another tab.
  const reloadLog = log.reload
  useFocusEffect(
    useCallback(() => {
      void loadPlans().catch(() => {
        setPlans((current) => current ?? { latest: null, ready: null, diet: null })
      })
      void reloadLog()
    }, [loadPlans, reloadLog]),
  )

  async function refresh() {
    setRefreshing(true)
    await Promise.allSettled([reload(), loadPlans(), log.reload()])
    setRefreshing(false)
  }

  if (error && !me) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
      </Screen>
    )
  }

  const week = weekProgress(log.sessions, log.todayDate)
  const target = plans?.ready?.plan?.days.length ?? null

  return (
    <Screen showAvatar={false} onRefresh={() => void refresh()} refreshing={refreshing}>
      {me ? <TopRow me={me} /> : <Skeleton height={56} />}
      {me && plans && !log.loading ? (
        <>
          <WeekHero me={me} trainedDays={week.trainedDays} target={target} targets={me.targets} />
          {target !== null && <WeekStrip days={week.days} />}
          <TodayCard plans={plans} log={log} />
          {me.targets && <MacroTiles targets={me.targets} />}
          {me.targets && <DietCard diet={plans.diet} />}
          <StoryCard me={me} trainedDays={week.trainedDays} target={target} />
          <MilestoneCelebration me={me} />
        </>
      ) : (
        <>
          <Skeleton height={320} />
          <Skeleton height={96} />
          <Skeleton height={180} />
        </>
      )}
    </Screen>
  )
}

/** Greeting on the left; streak and avatar on the right (Opal). */
function TopRow({ me }: { me: Me }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const { current } = me.streak
  return (
    <View style={styles.topRow}>
      <View style={{ flex: 1 }}>
        <Txt muted>{t(greetingKey())},</Txt>
        <Txt variant="displayL" numberOfLines={1}>
          {firstName(me.profile)}
        </Txt>
      </View>
      <View style={[styles.streakPill, { backgroundColor: colors.surfaceMuted }]}>
        <Flame
          size={16}
          color={current > 0 ? colors.accentIcon : colors.textSecondary}
          fill={current > 1 ? colors.accentIcon : 'transparent'}
        />
        <Txt variant="label" style={{ fontWeight: '700' }}>
          {formatNumber(current)}
        </Txt>
      </View>
      <ProfileAvatarLink />
    </View>
  )
}

/** Shows the streak celebration once per milestone day (remembered on this device). */
function MilestoneCelebration({ me }: { me: Me }) {
  const [show, setShow] = useState(false)
  const { current, activeToday, lastActiveDay } = me.streak
  const key = `streak-celebrated:${me.profile.id}:${lastActiveDay ?? ''}:${String(current)}`

  useEffect(() => {
    if (!activeToday || !isStreakMilestone(current)) return
    void AsyncStorage.getItem(key).then((seen) => {
      if (!seen) setShow(true)
    })
  }, [activeToday, current, key])

  if (!show) return null
  return (
    <StreakCelebration
      streak={me.streak}
      onClose={() => {
        setShow(false)
        void AsyncStorage.setItem(key, '1')
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Today's workout
// ---------------------------------------------------------------------------

function TodayCard({ plans, log }: { plans: Plans; log: ReturnType<typeof useWorkoutLog> }) {
  const { t } = useI18n()
  const colors = useColors()
  const ready = plans.ready
  const plan = ready?.plan
  const generating = plans.latest?.status === 'pending' || plans.latest?.status === 'generating'

  if (!ready || !plan || !log.today) {
    return (
      <Link href="/training" asChild>
        <Pressable>
          <Card style={styles.rowCard}>
            <View style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}>
              <Dumbbell size={24} color={colors.accentIcon} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption" muted>
                {t('training.homeCardTitle')}
              </Txt>
              <Txt variant="heading">
                {generating ? t('training.generatingTitle') : t('training.emptyTitle')}
              </Txt>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Card>
        </Pressable>
      </Link>
    )
  }

  const { dayIndex, doneToday } = log.today
  const day = plan.days[dayIndex]

  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Dumbbell size={16} color={colors.accentIcon} />
          <Txt variant="label" muted>
            {t('workout.today')}
          </Txt>
        </View>
        <Link href="/training" asChild>
          <Pressable style={styles.row} hitSlop={8}>
            <Txt variant="label" color="accentText">
              {t('training.viewPlan')}
            </Txt>
            <ArrowRight size={16} color={colors.accentIcon} />
          </Pressable>
        </Link>
      </View>
      <View style={{ gap: 2 }}>
        <Txt variant="title">{day ? workoutTitle(t, dayIndex, day.title) : null}</Txt>
        <Txt muted>
          {day?.focus} · {t('training.minutes', { count: day?.estimatedMinutes ?? 0 })}
        </Txt>
      </View>
      {doneToday ? (
        <DoneBadge />
      ) : (
        <Button
          onPress={() => {
            haptics.tap()
            void log.logDay(dayIndex)
          }}
          loading={log.pendingDay === dayIndex}
          icon={<Check size={16} color={colors.onAccent} strokeWidth={3} />}
          size="lg"
          style={{ alignSelf: 'stretch' }}
        >
          {t('workout.markDone')}
        </Button>
      )}
      <XpNote feedback={log.feedback} />
      <ErrorText>{log.error}</ErrorText>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Diet
// ---------------------------------------------------------------------------

function DietCard({ diet }: { diet: DietPlanRecord | null }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const plan = diet?.plan
  return (
    <Link href="/diet" asChild>
      <Pressable>
        <Card style={styles.rowCard}>
          <View style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}>
            <Salad size={24} color={colors.accentIcon} />
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
          <ChevronRight size={20} color={colors.textSecondary} />
        </Card>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
