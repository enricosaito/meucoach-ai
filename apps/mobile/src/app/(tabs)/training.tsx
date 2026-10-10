import type { BodyScan, WorkoutPlanRecord } from '@mycoach/core/training/contracts'
import { Link, useFocusEffect } from 'expo-router'
import { RefreshCw } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { BodyAnalysisCard } from '../../components/training/body-analysis-card'
import { PlanView } from '../../components/training/plan-view'
import { ProgressPhotos } from '../../components/training/progress-photos'
import { EmptyPlanCard, FailedCard, GeneratingCard } from '../../components/training/status-cards'
import { WorkoutHistory } from '../../components/training/workout-history'
import { ErrorText, Screen, Skeleton, Txt } from '../../components/ui'
import { fetchLatestPlan, fetchLatestReadyPlan, fetchScans } from '../../lib/data'
import { errorMessage, useI18n } from '../../lib/i18n'
import { useWorkoutLog } from '../../lib/use-workout-log'
import { radius, space, useColors } from '../../theme'

const POLL_MS = 3000

interface TrainingState {
  /** The newest plan request, whatever its status. */
  latest: WorkoutPlanRecord | null
  /** The newest finished plan (still shown while a newer one is generating). */
  ready: WorkoutPlanRecord | null
  scans: BodyScan[]
}

async function fetchTrainingState(): Promise<TrainingState> {
  const [latest, ready, scans] = await Promise.all([
    fetchLatestPlan(),
    fetchLatestReadyPlan(),
    fetchScans(),
  ])
  return { latest, ready, scans }
}

export default function TrainingScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const [state, setState] = useState<TrainingState | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const log = useWorkoutLog(state?.ready ?? null)
  const reloadLog = log.reload

  const load = useCallback(async () => {
    try {
      setState(await fetchTrainingState())
      setError('')
    } catch (e) {
      setError(errorMessage(t, e))
    }
  }, [t])

  // Reload whenever the tab comes into view: back from the plan wizard, or a workout logged on Home.
  useFocusEffect(
    useCallback(() => {
      void load()
      void reloadLog()
    }, [load, reloadLog]),
  )

  // While a plan is being generated, poll until it is ready or failed.
  const generating = state?.latest?.status === 'pending' || state?.latest?.status === 'generating'
  useEffect(() => {
    if (!generating) return
    const timer = setInterval(() => void load(), POLL_MS)
    return () => {
      clearInterval(timer)
    }
  }, [generating, load])

  async function refresh() {
    setRefreshing(true)
    await Promise.allSettled([load(), log.reload()])
    setRefreshing(false)
  }

  if (!state) {
    return (
      <Screen title={t('training.title')}>
        {error ? (
          <ErrorText>{error}</ErrorText>
        ) : (
          <>
            <Skeleton height={160} />
            <Skeleton height={40} />
            <Skeleton height={420} />
          </>
        )}
      </Screen>
    )
  }

  const { latest, ready, scans } = state
  const analysis = ready?.bodyScanId
    ? scans.find((s) => s.id === ready.bodyScanId)?.analysis
    : undefined

  return (
    <Screen title={t('training.title')} onRefresh={() => void refresh()} refreshing={refreshing}>
      {!latest && <EmptyPlanCard />}
      {latest && generating && <GeneratingCard withPhotos={latest.bodyScanId !== null} />}
      {latest?.status === 'failed' && <FailedCard />}

      {ready?.plan && (
        <>
          <PlanView key={ready.id} planId={ready.id} plan={ready.plan} log={log} />
          {!log.loading && <WorkoutHistory sessions={log.sessions} todayDate={log.todayDate} />}
          {analysis && <BodyAnalysisCard analysis={analysis} />}
        </>
      )}

      <ProgressPhotos scans={scans} onChange={() => void load()} />

      {ready?.plan && !generating && (
        <Link href="/new-plan" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.update,
              { backgroundColor: pressed ? colors.accentSoft : 'transparent' },
            ]}
          >
            <RefreshCw size={16} color={colors.accent} />
            <Txt variant="label" color="accent">
              {t('training.updatePlan')}
            </Txt>
          </Pressable>
        </Link>
      )}
      <ErrorText>{error}</ErrorText>
    </Screen>
  )
}

const styles = StyleSheet.create({
  update: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
  },
})
