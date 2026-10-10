import { Link } from 'expo-router'
import { AlertTriangle, ArrowRight, Check, Dumbbell, RefreshCw } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { Card, Txt } from '../ui'

/** No plan yet: what the plan is and the way into the questionnaire. */
export function EmptyPlanCard() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Appear>
      <Card style={{ gap: space.lg, overflow: 'hidden' }}>
        <View style={[styles.glow, { backgroundColor: colors.accentSoft }]} />
        <View style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}>
          <Dumbbell size={24} color={colors.accent} />
        </View>
        <View style={{ gap: space.xs }}>
          <Txt variant="title">{t('training.emptyTitle')}</Txt>
          <Txt muted>{t('training.emptyBody')}</Txt>
        </View>
        <Link href="/new-plan" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.accent, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Txt style={{ color: colors.accentFg, fontWeight: '600' }}>
              {t('training.createPlan')}
            </Txt>
            <ArrowRight size={16} color={colors.accentFg} />
          </Pressable>
        </Link>
      </Card>
    </Appear>
  )
}

/** Cosmetic progress: the real status comes from polling, steps advance with elapsed time. */
export function GeneratingCard({ withPhotos }: { withPhotos: boolean }) {
  const { t } = useI18n()
  const colors = useColors()
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const steps = [
    ...(withPhotos ? [t('training.stepAnalyzing')] : []),
    t('training.stepDesigning'),
    t('training.stepChecking'),
  ]
  const current = Math.min(steps.length - 1, Math.floor(elapsed / 12))

  return (
    <Appear>
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: 2 }}>
          <Txt variant="heading">{t('training.generatingTitle')}</Txt>
          <Txt variant="caption" muted>
            {t('training.generatingBody')}
          </Txt>
        </View>
        <View style={{ gap: space.md }} accessibilityLiveRegion="polite">
          {steps.map((label, i) => {
            const done = i < current
            const active = i === current
            return (
              <View key={label} style={styles.step}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: done
                        ? colors.accent
                        : active
                          ? colors.accentSoft
                          : colors.surface2,
                    },
                  ]}
                >
                  {done ? (
                    <Check size={14} color={colors.accentFg} strokeWidth={3} />
                  ) : active ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <View style={[styles.pip, { backgroundColor: colors.muted }]} />
                  )}
                </View>
                <Txt muted={i > current}>{label}</Txt>
              </View>
            )
          })}
        </View>
      </Card>
    </Appear>
  )
}

export function FailedCard() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Card style={{ flexDirection: 'row', borderColor: colors.danger }}>
      <AlertTriangle size={20} color={colors.danger} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Txt variant="heading">{t('training.failedTitle')}</Txt>
        <Txt variant="caption" muted>
          {t('training.failedBody')}
        </Txt>
        <Link href="/new-plan" asChild>
          <Pressable
            accessibilityRole="button"
            style={[styles.retry, { backgroundColor: colors.surface2 }]}
          >
            <RefreshCw size={14} color={colors.fg} />
            <Txt variant="label">{t('common.tryAgain')}</Txt>
          </Pressable>
        </Link>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.8,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    height: 48,
    borderRadius: radius.full,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pip: { width: 6, height: 6, borderRadius: 3 },
  retry: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
  },
})
