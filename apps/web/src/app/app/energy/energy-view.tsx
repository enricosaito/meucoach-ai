'use client'

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
import { ACTIVITY_LABELS, formatDate, formatKcal } from '@/lib/labels'
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Energy"
        description="How many calories your body uses each day, estimated with the Mifflin-St Jeor equation."
      />
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
  const { setLatestAssessment } = useMe()
  const resultRef = useRef<HTMLDivElement>(null)
  const [justUpdated, setJustUpdated] = useState(false)

  return (
    <>
      {latest && (
        <div ref={resultRef} className="scroll-mt-24">
          <ResultCard assessment={latest} highlight={justUpdated} />
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
            Your result
          </p>
          {highlight ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
              <Check className="size-3.5" aria-hidden />
              Updated
            </span>
          ) : (
            <span className="text-xs text-muted">{formatDate(assessment.createdAt)}</span>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Maintenance (TDEE)</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatKcal(assessment.tdeeKcal)}
              </span>
              <span className="text-muted">kcal/day</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Calories to keep your weight steady at your activity level.
            </p>
          </div>
          <div className="sm:border-l sm:border-line sm:pl-4">
            <p className="text-sm text-muted">At rest (BMR)</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatKcal(assessment.bmrKcal)}
              </span>
              <span className="text-muted">kcal/day</span>
            </p>
            <p className="mt-1 text-sm text-muted">What your body burns doing nothing at all.</p>
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
        title={latest ? 'Update your numbers' : 'Your details'}
        description={
          <>
            Using {imperial ? 'imperial' : 'metric'} units ·{' '}
            <Link href="/app/profile" className="font-medium text-accent hover:underline">
              change
            </Link>
          </>
        }
      />
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Sex">
          <Segmented
            label="Sex"
            value={sex}
            onChange={update(setSex)}
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age" htmlFor="age">
            <NumberInput
              id="age"
              inputMode="numeric"
              unit="years"
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
          <Field label="Weight" htmlFor="weight">
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
          <Field label="Height">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                aria-label="Height, feet"
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
                aria-label="Height, inches"
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
          <Field label="Height" htmlFor="height">
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
          <legend className="mb-1.5 text-sm font-medium">How active are you?</legend>
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
                      {ACTIVITY_LABELS[level].label}
                    </span>
                    <span className="block text-sm text-muted">
                      {ACTIVITY_LABELS[level].description}
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
          {save.pending ? 'Calculating…' : latest ? 'Recalculate' : 'Calculate my energy'}
        </Button>
        <p className="-mt-2 flex items-start gap-1.5 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          An estimate for healthy adults. It can be off for athletes or during pregnancy.
        </p>
      </form>
    </Card>
  )
}
