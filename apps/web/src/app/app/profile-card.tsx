'use client'

import { Button, Card, ErrorText, Field, inputClass } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useWrite } from '@/lib/use-write'
import {
  GOAL_TYPES,
  type Goals,
  type Profile,
  type UnitSystem,
} from '@mycoach/core/profile/contracts'
import { useState, type FormEvent } from 'react'

const GOAL_LABELS: Record<(typeof GOAL_TYPES)[number], string> = {
  lose_fat: 'Lose fat',
  maintain: 'Maintain',
  build_muscle: 'Build muscle',
  improve_health: 'Improve health',
}

export function ProfileCard({
  profile,
  onSaved,
}: {
  profile: Profile
  onSaved: (profile: Profile) => void
}) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [units, setUnits] = useState<UnitSystem>(profile.units)
  const [goal, setGoal] = useState<Goals['primary'] | ''>(profile.goals.primary ?? '')
  const [saved, setSaved] = useState(false)

  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        {
          json: {
            displayName: displayName.trim() || null,
            units,
            timezone: browserTimeZone,
            goals: goal ? { ...profile.goals, primary: goal } : profile.goals,
          },
        },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  function changed() {
    save.reset()
    setSaved(false)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await save.run()
    if (result) {
      onSaved(result.profile)
      setSaved(true)
    }
  }

  return (
    <Card title="Profile">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input
            className={inputClass}
            value={displayName}
            maxLength={80}
            onChange={(e) => {
              setDisplayName(e.target.value)
              changed()
            }}
          />
        </Field>
        <Field label="Goal">
          <select
            className={inputClass}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value as Goals['primary'] | '')
              changed()
            }}
          >
            <option value="">Not set</option>
            {GOAL_TYPES.map((g) => (
              <option key={g} value={g}>
                {GOAL_LABELS[g]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Units">
          <select
            className={inputClass}
            value={units}
            onChange={(e) => {
              setUnits(e.target.value as UnitSystem)
              changed()
            }}
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lb, ft/in)</option>
          </select>
        </Field>
        <Field label="Time zone">
          <input className={`${inputClass} bg-slate-50`} value={browserTimeZone} readOnly />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={save.pending}>
            {save.pending ? 'Saving…' : 'Save profile'}
          </Button>
          {saved && <span className="text-sm text-emerald-700">Saved</span>}
          <ErrorText>{save.error}</ErrorText>
        </div>
      </form>
    </Card>
  )
}
