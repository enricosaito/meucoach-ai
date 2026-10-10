import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  ClipboardList,
  Dumbbell,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { Button, Card, Txt } from '../ui'

/** No plan yet: a short pitch, how it works in three steps, and the way into the questionnaire. */
export function EmptyPlanCard() {
  const { t } = useI18n()
  const colors = useColors()
  const steps = [
    { icon: ClipboardList, label: t('training.emptyStep1') },
    { icon: Camera, label: t('training.emptyStep2') },
    { icon: Sparkles, label: t('training.emptyStep3') },
  ]
  return (
    <Appear>
      <Card style={styles.emptyCard}>
        {/* Soft wash of the accent behind the header; fades into the card in both themes. */}
        <LinearGradient
          colors={[colors.accentSoft, colors.surface]}
          locations={[0, 0.55]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={{ gap: space.lg }}>
          <View style={[styles.iconTile, { backgroundColor: colors.accent }]}>
            <Dumbbell size={24} color={colors.onAccent} />
          </View>
          <View style={{ gap: space.xs }}>
            <Txt variant="title">{t('training.emptyTitle')}</Txt>
            <Txt muted>{t('training.homeEmptyBody')}</Txt>
          </View>
        </View>

        <View style={[styles.steps, { backgroundColor: colors.surfaceMuted }]}>
          {steps.map(({ icon: Icon, label }) => (
            <View key={label} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: colors.surface }]}>
                <Icon size={16} color={colors.accentIcon} />
              </View>
              <Txt variant="label" style={{ flex: 1 }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>

        <Button
          onPress={() => {
            haptics.tap()
            router.push('/new-plan')
          }}
          trailingIcon={<ArrowRight size={16} color={colors.onAccent} />}
          style={{ alignSelf: 'stretch' }}
        >
          {t('training.createPlan')}
        </Button>
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
                          : colors.surfaceMuted,
                    },
                  ]}
                >
                  {done ? (
                    <Check size={14} color={colors.onAccent} strokeWidth={3} />
                  ) : active ? (
                    <ActivityIndicator size="small" color={colors.accentIcon} />
                  ) : (
                    <View style={[styles.pip, { backgroundColor: colors.textSecondary }]} />
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
    <Card style={{ flexDirection: 'row', borderColor: colors.error }}>
      <AlertTriangle size={20} color={colors.error} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Txt variant="heading">{t('training.failedTitle')}</Txt>
        <Txt variant="caption" muted>
          {t('training.failedBody')}
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push('/new-plan')
          }}
          style={[styles.retry, { backgroundColor: colors.surfaceMuted }]}
        >
          <RefreshCw size={14} color={colors.textPrimary} />
          <Txt variant="label">{t('common.tryAgain')}</Txt>
        </Pressable>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  emptyCard: { gap: space.xl, overflow: 'hidden' },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { borderRadius: radius.md, padding: space.md, gap: space.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
