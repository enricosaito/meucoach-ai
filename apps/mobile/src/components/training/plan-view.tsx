import type { WorkoutDay, WorkoutPlan } from '@mycoach/core/training/contracts'
import { router } from 'expo-router'
import {
  CalendarDays,
  Check,
  Clock,
  Flame,
  Info,
  Lightbulb,
  Snowflake,
  TrendingUp,
} from 'lucide-react-native'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import type { useWorkoutLog } from '../../lib/use-workout-log'
import { dayLetter, workoutTitle } from '../../lib/workout-names'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { Button, Card, ErrorText, Txt } from '../ui'
import { XpNote } from '../xp-note'
import { ShiningSparkles } from './shining-sparkles'

type WorkoutLog = ReturnType<typeof useWorkoutLog>

/**
 * The ready plan: a compact header (summary behind an info tooltip, ask the coach), lettered
 * workouts A/B/C… you can tap or swipe through (today's first), then the plan details.
 */
export function PlanView({
  planId,
  plan,
  log,
}: {
  planId: string
  plan: WorkoutPlan
  log: WorkoutLog
}) {
  const { t } = useI18n()
  const colors = useColors()
  // Until the user picks a workout, show today's.
  const [picked, setPicked] = useState<number | null>(null)
  const todayIndex = log.today?.dayIndex ?? null
  const dayIndex = picked ?? todayIndex ?? 0
  const doneToday = new Set(
    log.sessions
      .filter((s) => s.planId === planId && s.localDate === log.todayDate)
      .map((s) => s.dayIndex),
  )

  return (
    <>
      <PlanHeader plan={plan} log={log} />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -space.lg }}
          contentContainerStyle={styles.pills}
        >
          {plan.days.map((d, i) => {
            const selected = i === dayIndex
            return (
              <Pressable
                key={`${d.title}-${String(i)}`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={workoutTitle(t, i, d.title)}
                onPress={() => {
                  haptics.tap()
                  setPicked(i)
                }}
                style={[styles.pill, { backgroundColor: selected ? colors.fg : colors.surface2 }]}
              >
                <Txt
                  variant="heading"
                  style={{ color: selected ? colors.bg : colors.muted, fontWeight: '700' }}
                >
                  {dayLetter(i)}
                </Txt>
                {doneToday.has(i) && (
                  <View style={[styles.pillDone, { backgroundColor: colors.accent }]}>
                    <Check size={10} strokeWidth={3.5} color={colors.accentFg} />
                  </View>
                )}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <DayCarousel
        days={plan.days}
        index={dayIndex}
        onSwipe={(i) => {
          haptics.tap()
          setPicked(i)
        }}
        renderDay={(day, i) => (
          <DayCard
            day={day}
            dayIndex={i}
            isToday={i === todayIndex}
            done={doneToday.has(i)}
            log={log}
          />
        )}
      />

      <AboutPlan plan={plan} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function PlanHeader({ plan, log }: { plan: WorkoutPlan; log: WorkoutLog }) {
  const { t, tc } = useI18n()
  const colors = useColors()
  const [showInfo, setShowInfo] = useState(false)
  // Centre of the info icon, so the tooltip caret points at it whatever the plan name length.
  const [caretX, setCaretX] = useState(0)

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Txt variant="caption" color="accent" style={styles.eyebrow}>
          {t('training.homeCardTitle').toUpperCase()}
        </Txt>
        <View style={styles.titleRow}>
          <Txt variant="title" style={{ flexShrink: 1 }}>
            {plan.name}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('training.aboutPlan')}
            accessibilityState={{ expanded: showInfo }}
            hitSlop={10}
            onLayout={(e) => {
              setCaretX(e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2)
            }}
            onPress={() => {
              haptics.tap()
              setShowInfo((v) => !v)
            }}
            style={[
              styles.infoButton,
              { backgroundColor: showInfo ? colors.accentSoft : 'transparent' },
            ]}
          >
            <Info size={18} color={showInfo ? colors.accent : colors.muted} />
          </Pressable>
        </View>
      </View>

      {showInfo && (
        <Appear>
          {/* Tooltip: a bubble pointing at the info icon; tap it to close. */}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setShowInfo(false)
            }}
          >
            <View
              style={[styles.caret, { backgroundColor: colors.surface2, marginLeft: caretX - 6 }]}
            />
            <View style={[styles.bubble, { backgroundColor: colors.surface2 }]}>
              <Txt variant="label" style={{ fontWeight: '400' }}>
                {plan.summary}
              </Txt>
            </View>
          </Pressable>
        </Appear>
      )}

      {log.today && log.today.thisWeek > 0 ? (
        <Txt variant="caption" muted>
          {tc('workout.thisWeek', log.today.thisWeek)}
        </Txt>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          haptics.tap()
          router.push('/coach')
        }}
        style={({ pressed }) => [
          styles.askCoach,
          {
            backgroundColor: pressed ? colors.accentSoft : colors.surface2,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <ShiningSparkles size={16} color={colors.accent} />
        <Txt variant="label" style={{ fontWeight: '600' }}>
          {t('training.askCoach')}
        </Txt>
      </Pressable>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Swipeable workouts
// ---------------------------------------------------------------------------

/**
 * One full-width page per workout, swiped sideways with paging. It follows `index` (a tapped
 * pill, or today's workout once the log loads) and reports swipes. The container takes the
 * current page's height, so a short workout doesn't leave a gap under it.
 */
function DayCarousel({
  days,
  index,
  onSwipe,
  renderDay,
}: {
  days: WorkoutDay[]
  index: number
  onSwipe: (index: number) => void
  renderDay: (day: WorkoutDay, index: number) => ReactNode
}) {
  const { width } = useWindowDimensions()
  const scroller = useRef<ScrollView>(null)
  const [heights, setHeights] = useState<Record<number, number>>({})
  // Mount on the right page (native honours this before layout); later moves use scrollTo.
  const [initialOffset] = useState(() => ({ x: index * width, y: 0 }))
  // The page on screen, and the page an animated scroll is heading to (pages it passes on the
  // way are not swipes).
  const page = useRef<number | null>(null)
  const target = useRef<number | null>(null)

  useEffect(() => {
    if (page.current === index) return
    // The first placement jumps; later changes glide.
    const animated = page.current !== null
    target.current = animated ? index : null
    page.current = animated ? page.current : index
    scroller.current?.scrollTo({ x: index * width, animated })
  }, [index, width])

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width)
    if (next < 0 || next >= days.length || next === page.current) return
    page.current = next
    if (target.current !== null) {
      if (next === target.current) target.current = null
      return
    }
    onSwipe(next)
  }

  return (
    <ScrollView
      ref={scroller}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentOffset={initialOffset}
      style={{ marginHorizontal: -space.lg, height: heights[index] }}
      contentContainerStyle={{ alignItems: 'flex-start' }}
    >
      {days.map((day, i) => (
        <View
          key={`${day.title}-${String(i)}`}
          style={{ width, paddingHorizontal: space.lg }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height
            setHeights((prev) => (prev[i] === h ? prev : { ...prev, [i]: h }))
          }}
        >
          {renderDay(day, i)}
        </View>
      ))}
    </ScrollView>
  )
}

function DayCard({
  day,
  dayIndex,
  isToday,
  done,
  log,
}: {
  day: WorkoutDay
  dayIndex: number
  isToday: boolean
  done: boolean
  log: WorkoutLog
}) {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: 2 }}>
        {isToday && (
          <Txt variant="caption" color="accent" style={styles.eyebrow}>
            {t('workout.today').toUpperCase()}
          </Txt>
        )}
        <Txt variant="heading">{workoutTitle(t, dayIndex, day.title)}</Txt>
        <Txt variant="label" muted style={{ fontWeight: '400' }}>
          {day.focus} · {t('training.minutes', { count: day.estimatedMinutes })}
        </Txt>
      </View>

      <Note icon={<Flame size={16} color={colors.energy} />} label={t('training.warmup')}>
        {day.warmup}
      </Note>

      <View>
        {day.exercises.map((exercise, i) => (
          <View
            key={`${exercise.name}-${String(i)}`}
            style={[
              styles.exercise,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
            ]}
          >
            <View style={[styles.number, { backgroundColor: colors.surface2 }]}>
              <Txt variant="label" style={{ fontWeight: '700' }}>
                {i + 1}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.exerciseTop}>
                <Txt style={{ flex: 1, fontWeight: '600' }}>{exercise.name}</Txt>
                <Txt style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {t('training.setsReps', { sets: exercise.sets, reps: exercise.reps })}
                </Txt>
              </View>
              <Txt variant="caption" muted>
                {t(`training.muscles.${exercise.muscleGroup}`)} ·{' '}
                {t('training.rest', { seconds: exercise.restSeconds })}
              </Txt>
              {exercise.notes ? <Txt variant="caption">{exercise.notes}</Txt> : null}
            </View>
          </View>
        ))}
      </View>

      <Note icon={<Snowflake size={16} color={colors.fat} />} label={t('training.cooldown')}>
        {day.cooldown}
      </Note>

      {done ? (
        <View style={[styles.doneBadge, { backgroundColor: colors.accentSoft }]}>
          <Check size={16} color={colors.accent} strokeWidth={3} />
          <Txt variant="label" color="accent">
            {t('workout.doneToday')}
          </Txt>
        </View>
      ) : (
        <Button
          onPress={() => {
            haptics.tap()
            void log.logDay(dayIndex)
          }}
          loading={log.pendingDay === dayIndex}
          disabled={log.pendingDay !== null || log.loading}
          icon={<Check size={16} color={colors.accentFg} strokeWidth={3} />}
          style={{ alignSelf: 'stretch' }}
        >
          {t('workout.markDayDone')}
        </Button>
      )}
      {/* Feedback belongs to the workout that was just logged, not every page. */}
      {log.lastLoggedDay === dayIndex && <XpNote feedback={log.feedback} />}
      {log.errorDay === dayIndex && <ErrorText>{log.error}</ErrorText>}
    </Card>
  )
}

function Note({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  const colors = useColors()
  return (
    <View style={[styles.note, { backgroundColor: colors.surface2 }]}>
      <View style={{ marginTop: 1 }}>{icon}</View>
      <Txt variant="label" style={{ flex: 1, fontWeight: '400' }}>
        <Txt variant="label">{label}: </Txt>
        <Txt variant="label" muted style={{ fontWeight: '400' }}>
          {children}
        </Txt>
      </Txt>
    </View>
  )
}

// ---------------------------------------------------------------------------
// About the plan (bottom): key numbers, progression, tips
// ---------------------------------------------------------------------------

function AboutPlan({ plan }: { plan: WorkoutPlan }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const minutes = plan.days[0]?.estimatedMinutes ?? 0
  return (
    <Card style={{ gap: space.lg }}>
      <Txt variant="heading">{t('training.aboutPlan')}</Txt>
      {/* Three equal stats: always one row, whatever the language or phone width. */}
      <View style={[styles.stats, { backgroundColor: colors.surface2 }]}>
        {[
          { icon: CalendarDays, value: plan.days.length, label: t('training.statDays') },
          { icon: Clock, value: minutes, label: t('training.statMinutes') },
          { icon: TrendingUp, value: plan.durationWeeks, label: t('training.statWeeks') },
        ].map(({ icon: Icon, value, label }, i) => (
          <View
            key={label}
            style={[
              styles.stat,
              i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
            ]}
          >
            <Icon size={16} color={colors.accent} />
            <Txt variant="title" style={{ fontVariant: ['tabular-nums'] }}>
              {formatNumber(value)}
            </Txt>
            <Txt variant="caption" muted numberOfLines={1}>
              {label}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        <View style={styles.row}>
          <TrendingUp size={16} color={colors.accent} />
          <Txt variant="label" style={{ fontWeight: '600' }}>
            {t('training.progression')}
          </Txt>
        </View>
        <Txt muted>{plan.progression}</Txt>
      </View>

      <View style={{ gap: space.sm }}>
        <View style={styles.row}>
          <Lightbulb size={16} color={colors.energy} />
          <Txt variant="label" style={{ fontWeight: '600' }}>
            {t('training.tips')}
          </Txt>
        </View>
        {plan.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
            <Txt muted style={{ flex: 1 }}>
              {tip}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  eyebrow: { fontWeight: '700', letterSpacing: 0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caret: {
    width: 12,
    height: 12,
    marginBottom: -6,
    transform: [{ rotate: '45deg' }],
  },
  bubble: { borderRadius: radius.md, padding: space.md },
  askCoach: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 44,
    borderRadius: radius.full,
  },
  pills: { paddingHorizontal: space.lg, gap: space.sm },
  pill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDone: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: space.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: space.xs },
  note: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md },
  exercise: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  exerciseTop: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 48,
    borderRadius: radius.full,
  },
  tip: { flexDirection: 'row', gap: space.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
})
