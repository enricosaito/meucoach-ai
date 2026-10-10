'use client'

import { TargetsCard } from '@/components/targets-card'
import {
  Button,
  Card,
  cx,
  ErrorText,
  Field,
  NumberInput,
  PageHeader,
  Segmented,
  SectionTitle,
  Skeleton,
} from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useI18n } from '@/lib/i18n/client'
import { useWrite } from '@/lib/use-write'
import {
  ACTIVITY_LEVELS,
  cmToFeetInches,
  feetInchesToCm,
  kgToPounds,
  poundsToKg,
  type ActivityLevel,
  type Assessment,
  type Sex,
  type UnitSystem,
} from '@mycoach/core/profile/contracts'
import { Check, Flame, Info } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
import { useMe } from '../me-context'

export function EnergyView() {
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('energy.title')} description={t('energy.description')} />
      {me ? (
        <EnergyContent units={me.profile.units} latest={me.latestAssessment} />
      ) : (
        <>
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-[34rem] rounded-3xl" />
        </>
      )}
    </div>
  )
}

function EnergyContent({ units, latest }: { units: UnitSystem; latest: Assessment | null }) {
  const { me, setLatestAssessment } = useMe()
  const resultRef = useRef<HTMLDivElement>(null)
  const [justUpdated, setJustUpdated] = useState(false)

  return (
    <>
      {latest && (
        <div ref={resultRef} className="flex scroll-mt-24 flex-col gap-5">
          <ResultCard assessment={latest} highlight={justUpdated} />
          {me?.targets && <TargetsCard targets={me.targets} goal={me.profile.goals.primary} />}
        </div>
      )}
      <AssessmentForm
        units={units}
        latest={latest}
        onSaved={(assessment) => {
          setLatestAssessment(assessment)
          setJustUpdated(true)
          requestAnimationFrame(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        }}
      />
    </>
  )
}

function ResultCard({ assessment, highlight }: { assessment: Assessment; highlight: boolean }) {
  const { t, formatNumber, formatDate } = useI18n()
  return (
    <Card
      key={assessment.id}
      className={cx('relative overflow-hidden', highlight && 'animate-rise-in')}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-energy-soft blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
            <Flame className="size-4 text-energy" aria-hidden />
            {t('energy.yourResult')}
          </p>
          {highlight ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
              <Check className="size-3.5" aria-hidden />
              {t('energy.updated')}
            </span>
          ) : (
            <span className="text-xs text-muted">{formatDate(assessment.createdAt)}</span>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted">{t('energy.tdee')}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatNumber(assessment.tdeeKcal)}
              </span>
              <span className="text-muted">{t('common.kcalPerDay')}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{t('energy.tdeeHelp')}</p>
          </div>
          <div className="sm:border-l sm:border-line sm:pl-4">
            <p className="text-sm text-muted">{t('energy.bmr')}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatNumber(assessment.bmrKcal)}
              </span>
              <span className="text-muted">{t('common.kcalPerDay')}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{t('energy.bmrHelp')}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AssessmentForm({
  units,
  latest,
  onSaved,
}: {
  units: UnitSystem
  latest: Assessment | null
  onSaved: (assessment: Assessment) => void
}) {
  const { t } = useI18n()
  const imperial = units === 'imperial'
  const initialFeetInches = latest ? cmToFeetInches(latest.heightCm) : null

  const [sex, setSex] = useState<Sex>(latest?.sex ?? 'female')
  const [age, setAge] = useState(latest ? String(latest.ageYears) : '')
  const [heightCm, setHeightCm] = useState(latest ? String(latest.heightCm) : '')
  const [feet, setFeet] = useState(initialFeetInches ? String(initialFeetInches.feet) : '')
  const [inches, setInches] = useState(initialFeetInches ? String(initialFeetInches.inches) : '')
  const [weight, setWeight] = useState(
    latest ? String(imperial ? kgToPounds(latest.weightKg) : latest.weightKg) : '',
  )
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    latest?.activityLevel ?? 'moderate',
  )

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.assessments.$post(
        {
          json: {
            sex,
            ageYears: Number(age),
            heightCm: imperial
              ? feetInchesToCm(Number(feet), Number(inches || 0))
              : Number(heightCm),
            weightKg: imperial ? poundsToKg(Number(weight)) : Number(weight),
            activityLevel,
          },
        },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  function update<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      save.reset()
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await save.run()
    if (result) onSaved(result.assessment)
  }

  return (
    <Card>
      <SectionTitle
        title={latest ? t('energy.updateTitle') : t('energy.detailsTitle')}
        description={
          <>
            {t('energy.usingUnits', {
              units: imperial ? t('energy.imperial') : t('energy.metric'),
            })}{' '}
            ·{' '}
            <Link href="/app/profile" className="font-medium text-accent hover:underline">
              {t('energy.change')}
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label={t('energy.sex')}>
          <Segmented
            label={t('energy.sex')}
            value={sex}
            onChange={update(setSex)}
            options={[
              { value: 'female', label: t('energy.female') },
              { value: 'male', label: t('energy.male') },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('energy.age')} htmlFor="age">
            <NumberInput
              id="age"
              inputMode="numeric"
              unit={t('energy.years')}
              min={15}
              max={100}
              step={1}
              required
              value={age}
              onChange={(e) => {
                update(setAge)(e.target.value)
              }}
            />
          </Field>
          <Field label={t('energy.weight')} htmlFor="weight">
            <NumberInput
              id="weight"
              unit={imperial ? 'lb' : 'kg'}
              step="0.1"
              min={imperial ? 66 : 30}
              max={imperial ? 770 : 350}
              required
              value={weight}
              onChange={(e) => {
                update(setWeight)(e.target.value)
              }}
            />
          </Field>
        </div>

        {imperial ? (
          <Field label={t('energy.height')}>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label={t('energy.heightFeet')}
                inputMode="numeric"
                unit="ft"
                min={3}
                max={8}
                required
                value={feet}
                onChange={(e) => {
                  update(setFeet)(e.target.value)
                }}
              />
              <NumberInput
                aria-label={t('energy.heightInches')}
                inputMode="numeric"
                unit="in"
                min={0}
                max={11}
                value={inches}
                onChange={(e) => {
                  update(setInches)(e.target.value)
                }}
              />
            </div>
          </Field>
        ) : (
          <Field label={t('energy.height')} htmlFor="height">
            <NumberInput
              id="height"
              unit="cm"
              step="0.1"
              min={100}
              max={250}
              required
              value={heightCm}
              onChange={(e) => {
                update(setHeightCm)(e.target.value)
              }}
            />
          </Field>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">{t('energy.activityQuestion')}</legend>
          <div className="flex flex-col gap-2">
            {ACTIVITY_LEVELS.map((level) => {
              const checked = activityLevel === level
              return (
                <label
                  key={level}
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-[border-color,background-color] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                    checked
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <input
                    type="radio"
                    name="activity"
                    value={level}
                    checked={checked}
                    onChange={() => {
                      update(setActivityLevel)(level)
                    }}
                    className="sr-only"
                  />
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium">
                      {t(`activity.${level}.label`)}
                    </span>
                    <span className="block text-sm text-muted">
                      {t(`activity.${level}.description`)}
                    </span>
                  </span>
                  <span
                    className={cx(
                      'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                      checked ? 'border-accent bg-accent text-accent-fg' : 'border-line',
                    )}
                    aria-hidden
                  >
                    {checked && <Check className="size-3" strokeWidth={3.5} />}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <ErrorText>{save.error}</ErrorText>

        <Button type="submit" loading={save.pending} className="w-full">
          {save.pending
            ? t('energy.calculating')
            : latest
              ? t('energy.recalculate')
              : t('energy.calculate')}
        </Button>
        <p className="-mt-2 flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          {t('energy.disclaimer')}
        </p>
      </form>
    </Card>
  )
}
