import { Loader2 } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-grid shrink-0 place-items-center rounded-[30%] bg-accent text-accent-fg',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none">
        <path
          d="M4 15.5 8.5 11l3.5 3.5L20 6.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="6.5" r="1.6" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <LogoMark />
      {name}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cx('rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6', className)}
      {...props}
    />
  )
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    // Right padding on phones leaves room for the floating avatar (see AppShell).
    <header className="mb-5 pr-14 sm:mb-6 sm:pr-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
    </header>
  )
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

const buttonVariants = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]',
  secondary: 'bg-surface-2 text-fg hover:bg-line',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
}

const buttonSizes = {
  md: 'h-11 px-5 text-[15px]',
  sm: 'h-9 px-3.5 text-sm',
  icon: 'size-11',
}

/** Button styling for links that navigate (never nest a <button> inside a <Link>). */
export function buttonClass(
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'md',
) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,transform,opacity] duration-150 select-none active:scale-[0.97]',
    buttonVariants[variant],
    buttonSizes[size],
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<'button'> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  loading?: boolean
}) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,transform,opacity] duration-150 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export const inputClass =
  'h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg placeholder:text-muted/70 transition-[border-color,box-shadow] outline-none focus:border-accent focus:ring-4 focus:ring-ring disabled:opacity-60'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Numeric input with a unit suffix inside the field (e.g. "kg"). */
export function NumberInput({
  unit,
  className,
  ...props
}: ComponentProps<'input'> & { unit?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        className={cx(inputClass, 'tabular-nums', unit && 'pr-12', className)}
        {...props}
      />
      {unit && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">
          {unit}
        </span>
      )}
    </div>
  )
}

/** iOS-style segmented control. Renders radio inputs for accessibility. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: readonly { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  label: string
}) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-2xl bg-surface-2 p-1">
      {options.map((option) => {
        const checked = option.value === value
        return (
          <label
            key={option.value}
            className={cx(
              'flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
              checked ? 'bg-raised text-fg shadow-card' : 'text-muted hover:text-fg',
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
            {option.label}
          </label>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      {children}
    </p>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-2xl bg-surface-2', className)} />
}

export function Avatar({
  name,
  src,
  className,
}: {
  name: string | null
  /** Public image URL; falls back to initials. */
  src?: string | null
  className?: string
}) {
  const initials =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  return (
    <span
      className={cx(
        'inline-grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent-strong',
        className,
      )}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- small avatar from Supabase storage
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
