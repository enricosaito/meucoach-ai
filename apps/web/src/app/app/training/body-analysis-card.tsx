'use client'

import { Card } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { BodyAnalysis } from '@mycoach/core/training/contracts'
import { ScanLine } from 'lucide-react'

export function BodyAnalysisCard({ analysis }: { analysis: BodyAnalysis }) {
  const { t } = useI18n()
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <ScanLine className="size-4 text-accent" aria-hidden />
          {t('training.analysisTitle')}
        </h2>
        <span className="text-xs text-muted">
          {t('training.confidence', {
            level: t(`training.confidenceLevels.${analysis.confidence}`),
          })}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">{t('training.bodyFat')}</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
            {analysis.bodyFatPercentLow}–{analysis.bodyFatPercentHigh}%
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{t('training.bodyType')}</dt>
          <dd className="mt-0.5 font-semibold">{t(`training.bodyTypes.${analysis.bodyType}`)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-[15px]">{analysis.summary}</p>

      {analysis.priorityAreas.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-medium text-muted">{t('training.priorities')}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {analysis.priorityAreas.map((p, i) => (
              <li key={`${p.area}-${i}`} className="flex gap-3 rounded-2xl bg-surface-2 px-4 py-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
                  {i + 1}
                </span>
                <span className="text-[15px]">
                  <span className="font-medium">{t(`training.areas.${p.area}`)}</span>
                  <span className="text-muted"> · {p.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {analysis.postureNotes && <p className="mt-3 text-sm text-muted">{analysis.postureNotes}</p>}
      <p className="mt-4 text-xs text-muted">{t('training.analysisDisclaimer')}</p>
    </Card>
  )
}
