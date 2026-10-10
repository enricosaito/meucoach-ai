import type { WorkoutPlan } from '@mycoach/core/training/contracts'
import {
  CalendarDays,
  Check,
  Clock,
  Flame,
  Lightbulb,
  Snowflake,
  TrendingUp,
} from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import type { useWorkoutLog } from '../../lib/use-workout-log'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { Button, Card, ErrorText, Txt } from '../ui'
import { XpNote } from '../xp-note'

/**
 * The ready plan: overview, a day picker (today's rotation day first), the picked day's exercises
 * with "mark this day as done" (any day can be logged), then progression and tips.
 */
export function PlanView({
  planId,
  plan,
  log,
}: {
  planId: string
  plan: WorkoutPlan
  log: ReturnType<typeof useWorkoutLog>
}) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  // Until the user picks a day, show today's workout.
  const [picked, setPicked] = useState<number | null>(null)
  const todayIndex = log.today?.dayIndex ?? null
  const dayIndex = picked ?? todayIndex ?? 0
  const day = plan.days[dayIndex] ?? plan.days[0]
  const doneToday = new Set(
    log.sessions
      .filter((s) => s.planId === planId && s.localDate === log.todayDate)
      .map((s) => s.dayIndex),
  )
  const minutes = plan.days[0]?.estimatedMinutes ?? 0

  return (
    <>
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: space.xs }}>
          <Txt variant="caption" color="accent" style={styles.eyebrow}>
            {t('training.homeCardTitle').toUpperCase()}
          </Txt>
          <Txt variant="title">{plan.name}</Txt>
          <Txt muted>{plan.summary}</Txt>
        </View>
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
        {log.today && log.today.thisWeek > 0 ? (
          <Txt variant="caption" muted>
            {tc('workout.thisWeek', log.today.thisWeek)}
          </Txt>
        ) : null}
      </Card>

      {/* Day picker: bleeds to the screen edges so pills scroll under the gutter. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.lg }}
        contentContainerStyle={styles.days}
      >
        {plan.days.map((d, i) => {
          const selected = i === dayIndex
          return (
            <Pressable
              key={`${d.title}-${String(i)}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.tap()
                setPicked(i)
              }}
              style={[styles.dayPill, { backgroundColor: selected ? colors.fg : colors.surface2 }]}
            >
              {doneToday.has(i) && (
                <Check size={14} strokeWidth={3} color={selected ? colors.bg : colors.accent} />
              )}
              <Txt
                variant="label"
                style={{ color: selected ? colors.bg : colors.muted, fontWeight: '600' }}
              >
                {d.title.split('·')[0]?.trim() ?? d.title}
              </Txt>
            </Pressable>
          )
        })}
      </ScrollView>

      {day && (
        <Appear key={dayIndex}>
          <Card style={{ gap: space.lg }}>
            <View style={{ gap: 2 }}>
              {dayIndex === todayIndex && (
                <Txt variant="caption" color="accent" style={styles.eyebrow}>
                  {t('workout.today').toUpperCase()}
                </Txt>
              )}
              <Txt variant="heading">{day.title}</Txt>
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

            {doneToday.has(dayIndex) ? (
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
            <XpNote feedback={log.feedback} />
            <ErrorText>{log.error}</ErrorText>
          </Card>
        </Appear>
      )}

      <Card style={{ gap: space.sm }}>
        <View style={styles.row}>
          <TrendingUp size={16} color={colors.accent} />
          <Txt variant="heading">{t('training.progression')}</Txt>
        </View>
        <Txt muted>{plan.progression}</Txt>
        <View style={[styles.row, { marginTop: space.md }]}>
          <Lightbulb size={16} color={colors.energy} />
          <Txt variant="heading">{t('training.tips')}</Txt>
        </View>
        {plan.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
            <Txt muted style={{ flex: 1 }}>
              {tip}
            </Txt>
          </View>
        ))}
      </Card>
    </>
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stats: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: space.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: space.xs },
  days: { paddingHorizontal: space.lg, gap: space.sm },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
  },
  eyebrow: { fontWeight: '700', letterSpacing: 0.6 },
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
