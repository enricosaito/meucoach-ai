'use client'

import { cx } from '@/components/ui'
import { Check } from 'lucide-react'

/** A radio group rendered as full-width cards with a label and a description. */
export function OptionCards<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  name: string
  value: T
  options: { value: T; label: string; description: string }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-[border-color,background-color] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                checked
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => {
                  onChange(option.value)
                }}
                className="sr-only"
              />
              <span className="flex-1">
                <span className="block text-[15px] font-medium">{option.label}</span>
                <span className="block text-sm text-muted">{option.description}</span>
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
  )
}
