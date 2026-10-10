'use client'

import {
  Avatar,
  Button,
  Card,
  cx,
  ErrorText,
  Field,
  inputClass,
  SectionTitle,
  Skeleton,
} from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { avatarUrl, prepareAvatar, uploadAvatar } from '@/lib/avatar'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import { useWrite } from '@/lib/use-write'
import {
  GOAL_TYPES,
  greetingName,
  USERNAME_MAX_LENGTH,
  type Goals,
  type Profile,
} from '@mycoach/core/profile/contracts'
import {
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Loader2,
  Scale,
  Settings,
  Trash2,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
import { useMe } from '../me-context'

type GoalType = (typeof GOAL_TYPES)[number]

const GOAL_ICONS: Record<GoalType, LucideIcon> = {
  lose_fat: TrendingDown,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_health: HeartPulse,
}

export function ProfileView() {
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('profile.title')}
          </h1>
          <p className="mt-1 text-[15px] text-muted">{t('profile.description')}</p>
        </div>
        <Link
          href="/app/profile/settings"
          aria-label={t('profile.settings')}
          title={t('profile.settings')}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-[background-color,color,transform] hover:bg-line hover:text-fg active:scale-95"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      {me ? (
        <>
          <IdentityHeader profile={me.profile} />
          <ProfileForm profile={me.profile} />
          <Link
            href="/app/energy"
            className="flex items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4 shadow-card transition-colors hover:bg-surface-2"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-energy-soft text-energy">
              <Flame className="size-5" aria-hidden />
            </span>
            <span className="flex-1 font-medium">{t('profile.energyLink')}</span>
            <ChevronRight className="size-5 text-muted" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-[30rem] rounded-3xl" />
        </>
      )}
    </div>
  )
}

/** Big avatar with a camera button, plus the name the coach uses and the @username. */
function IdentityHeader({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(file: File) {
    setBusy(true)
    setError('')
    try {
      const blob = await prepareAvatar(file)
      const api = getApi().api.v1.me.avatar
      const { path, token } = await unwrap(api['upload-url'].$post({}, { headers: writeHeaders() }))
      await uploadAvatar(path, token, blob)
      const result = await unwrap(api.$put({ json: { path } }, { headers: writeHeaders() }))
      setProfile(result.profile)
    } catch (e) {
      setError(e instanceof DOMException ? t('profile.photoError') : errorMessage(t, e))
    } finally {
      setBusy(false)
    }
  }

  async function onRemove() {
    setBusy(true)
    setError('')
    try {
      const result = await unwrap(
        getApi().api.v1.me.avatar.$delete({}, { headers: writeHeaders() }),
      )
      setProfile(result.profile)
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col items-center text-center">
      <div className="relative">
        <Avatar
          name={greetingName(profile)}
          src={avatarUrl(profile.avatarPath)}
          className="size-24 text-3xl"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={profile.avatarPath ? t('profile.changePhoto') : t('profile.addPhoto')}
          className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-4 border-surface bg-accent text-accent-fg transition-transform active:scale-90 disabled:opacity-70"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-4" aria-hidden />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </div>
      <p className="mt-4 text-xl font-semibold tracking-tight">{greetingName(profile)}</p>
      <p className="text-[15px] text-muted">@{profile.username}</p>
      {profile.avatarPath && (
        <button
          type="button"
          onClick={() => void onRemove()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-muted hover:bg-surface-2 hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="size-3.5" aria-hidden />
          {t('profile.removePhoto')}
        </button>
      )}
      {error && (
        <div className="mt-3 w-full">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [username, setUsername] = useState(profile.username)
  const [goal, setGoal] = useState<Goals['primary']>(profile.goals.primary)
  const [saved, setSaved] = useState(false)

  const normalizedUsername = username.trim().toLowerCase()
  const dirty =
    displayName.trim() !== (profile.displayName ?? '') ||
    normalizedUsername !== profile.username ||
    goal !== profile.goals.primary

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        {
          json: {
            displayName: displayName.trim() || null,
            username: normalizedUsername,
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
      setProfile(result.profile)
      setSaved(true)
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Field
          label={t('profile.displayName')}
          htmlFor="display-name"
          hint={t('profile.displayNameHelp')}
        >
          <input
            id="display-name"
            className={inputClass}
            value={displayName}
            maxLength={40}
            autoComplete="given-name"
            placeholder={t('profile.displayNamePlaceholder')}
            onChange={(e) => {
              setDisplayName(e.target.value)
              changed()
            }}
          />
        </Field>

        <Field label={t('profile.username')} htmlFor="username" hint={t('profile.usernameHelp')}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
              @
            </span>
            <input
              id="username"
              className={cx(inputClass, 'pl-9')}
              value={username}
              maxLength={USERNAME_MAX_LENGTH}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              pattern="[A-Za-z0-9_.]{3,20}"
              required
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s/g, ''))
                changed()
              }}
            />
          </div>
        </Field>

        <fieldset>
          <SectionTitle title={t('profile.mainGoal')} description={t('profile.mainGoalHelp')} />
          <div className="grid grid-cols-2 gap-2.5">
            {GOAL_TYPES.map((g) => {
              const Icon = GOAL_ICONS[g]
              const checked = goal === g
              return (
                <label
                  key={g}
                  className={cx(
                    'relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-3.5 transition-[border-color,background-color] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                    checked
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g}
                    checked={checked}
                    onChange={() => {
                      setGoal(g)
                      changed()
                    }}
                    className="sr-only"
                  />
                  <Icon
                    className={cx('size-5', checked ? 'text-accent' : 'text-muted')}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-[15px] font-medium">{t(`goals.${g}.label`)}</span>
                    <span className="block text-xs text-muted">{t(`goals.${g}.description`)}</span>
                  </span>
                  {checked && (
                    <Check
                      className="absolute top-3 right-3 size-4 text-accent"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>

        <ErrorText>{save.error}</ErrorText>

        <Button type="submit" loading={save.pending} disabled={!dirty && !save.pending}>
          {saved && !dirty ? (
            <>
              <Check className="size-4" aria-hidden />
              {t('profile.saved')}
            </>
          ) : save.pending ? (
            t('profile.saving')
          ) : (
            t('profile.save')
          )}
        </Button>
      </form>
    </Card>
  )
}
