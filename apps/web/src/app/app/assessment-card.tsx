'use client'

import { Button, Card, ErrorText, Field, inputClass } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useWrite } from '@/lib/use-write'
import {
  ACTIVITY_LEVELS,
  feetInchesToCm,
  poundsToKg,
  type ActivityLevel,
  type Assessment,
  type Sex,
  type UnitSystem,
} from '@mycoach/core/profile/contracts'
import { useState, type FormEvent } from 'react'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  very_active: 'Very active (physical job or 2x/day)',
}

export function AssessmentCard({
  units,
  latest,
  onSaved,
}: {
  units: UnitSystem
  latest: Assessment | null
  onSaved: (assessment: Assessment) => void
}) {
  const [sex, setSex] = useState<Sex>(latest?.sex ?? 'female')
  const [age, setAge] = useState(latest ? String(latest.ageYears) : '')
  const [heightCm, setHeightCm] = useState(latest ? String(latest.heightCm) : '')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [weight, setWeight] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    latest?.activityLevel ?? 'moderate',
  )

  const imperial = units === 'imperial'
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
    <Card title="Energy test (Mifflin-St Jeor)">
      {latest && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Stat label="BMR (at rest)" value={latest.bmrKcal} />
          <Stat label="TDEE (maintenance)" value={latest.tdeeKcal} />
        </div>
      )}
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
        <Field label="Sex">
          <select
            className={inputClass}
            value={sex}
            onChange={(e) => {
              update(setSex)(e.target.value as Sex)
            }}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
        <Field label="Age">
          <input
            className={inputClass}
            inputMode="numeric"
            type="number"
            min={15}
            max={100}
            required
            value={age}
            onChange={(e) => {
              update(setAge)(e.target.value)
            }}
          />
        </Field>
        {imperial ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Height (ft)">
              <input
                className={inputClass}
                type="number"
                min={3}
                max={8}
                required
                value={feet}
                onChange={(e) => {
                  update(setFeet)(e.target.value)
                }}
              />
            </Field>
            <Field label="(in)">
              <input
                className={inputClass}
                type="number"
                min={0}
                max={11}
                value={inches}
                onChange={(e) => {
                  update(setInches)(e.target.value)
                }}
              />
            </Field>
          </div>
        ) : (
          <Field label="Height (cm)">
            <input
              className={inputClass}
              type="number"
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
        <Field label={imperial ? 'Weight (lb)' : 'Weight (kg)'}>
          <input
            className={inputClass}
            type="number"
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
        <div className="col-span-2">
          <Field label="Activity level">
            <select
              className={inputClass}
              value={activityLevel}
              onChange={(e) => {
                update(setActivityLevel)(e.target.value as ActivityLevel)
              }}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {ACTIVITY_LABELS[level]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Button type="submit" disabled={save.pending}>
            {save.pending ? 'Calculating…' : latest ? 'Retake test' : 'Calculate'}
          </Button>
          <ErrorText>{save.error}</ErrorText>
        </div>
      </form>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-emerald-50 p-3">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-2xl font-bold tabular-nums">
        {value.toLocaleString()} <span className="text-sm font-normal">kcal/day</span>
      </p>
    </div>
  )
}
