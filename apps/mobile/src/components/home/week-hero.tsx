import type { DailyTargets } from '@mycoach/core/nutrition/contracts'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { Beef, Flame, Star } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import type { Me } from '../../lib/me'
import { radius, space, useColors } from '../../theme'
import { ProgressRing } from '../progress-ring'
import { Txt } from '../ui'

const RING = 196

/**
 * The hero of Home (Opal-style): one ring for the week's workouts against the plan, and three
 * pills that explain the rest of the day: streak, level and the protein target.
 */
export function WeekHero({
  me,
  trainedDays,
  target,
  targets,
}: {
  me: Me
  trainedDays: number
  /** Workouts per week in the plan; null without a plan. */
  target: number | null
  targets: DailyTargets | null
}) {
  const { t, tc, formatNumber } = useI18n()
  const colors = useColors()
  const complete = target !== null && trainedDays >= target
  const { level, levelXp, levelSpan } = me.level

  return (
    <View style={[styles.card, { borderColor: colors.line }]}>
      <LinearGradient
        colors={[colors.accentSoft, colors.surface]}
        locations={[0, 0.75]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.ringWrap}>
        {target === null ? (
          <Link href="/training" asChild>
            <Pressable style={styles.center}>
              <ProgressRing
                size={RING}
                stroke={14}
                progress={0}
                color={colors.accent}
                trackColor={colors.line}
              >
                <Txt variant="label" muted style={styles.noPlan}>
                  {t('home.noPlanHero')}
                </Txt>
              </ProgressRing>
            </Pressable>
          </Link>
        ) : (
          <ProgressRing
            size={RING}
            stroke={14}
            progress={trainedDays / target}
            color={colors.accent}
            trackColor={colors.line}
          >
            <Txt style={styles.bigNumber}>
              {t('home.weekGoal', {
                done: formatNumber(trainedDays),
                target: formatNumber(target),
              })}
            </Txt>
            <Txt variant="caption" muted style={{ textAlign: 'center' }}>
              {complete ? t('home.weekComplete') : tc('home.workoutsThisWeek', target)}
            </Txt>
          </ProgressRing>
        )}
      </View>

      <View style={styles.pills}>
        <Pill
          icon={
            <Flame
              size={16}
              color={me.streak.current > 0 ? colors.energy : colors.muted}
              fill={me.streak.current > 1 ? colors.energy : 'transparent'}
            />
          }
          value={formatNumber(me.streak.current)}
          label={t('home.streakLabel')}
        />
        <Pill
          icon={
            <ProgressRing
              size={18}
              stroke={3}
              progress={levelSpan > 0 ? levelXp / levelSpan : 0}
              color={colors.accent}
              trackColor={colors.line}
            >
              <Star size={8} color={colors.accent} fill={colors.accent} />
            </ProgressRing>
          }
          value={formatNumber(level)}
          label={t('home.levelLabel')}
        />
        <Pill
          icon={<Beef size={16} color={colors.fat} />}
          value={targets ? t('common.grams', { value: formatNumber(targets.proteinG) }) : '—'}
          label={t('home.proteinLabel')}
        />
      </View>
    </View>
  )
}

function Pill({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const colors = useColors()
  return (
    <View style={styles.pillCol}>
      <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {icon}
        <Txt variant="label" style={{ fontWeight: '700' }}>
          {value}
        </Txt>
      </View>
      <Txt variant="caption" muted>
        {label}
      </Txt>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    gap: space.xl,
    alignItems: 'center',
  },
  ringWrap: { alignItems: 'center' },
  center: { alignItems: 'center' },
  bigNumber: { fontSize: 44, fontWeight: '700', letterSpacing: -1.2 },
  noPlan: { textAlign: 'center', paddingHorizontal: space.xxl },
  pills: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' },
  pillCol: { alignItems: 'center', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
