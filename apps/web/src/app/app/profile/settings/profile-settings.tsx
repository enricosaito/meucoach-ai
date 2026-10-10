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
  Dumbbell,
  HeartPulse,
  Loader2,
  Scale,
  Trash2,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useMe } from '../../me-context'

type GoalType = (typeof GOAL_TYPES)[number]

export const GOAL_ICONS: Record<GoalType, LucideIcon> = {
  lose_fat: TrendingDown,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_health: HeartPulse,
}

/** Photo, display name and @username: everything that identifies the user. */
export function ProfileSettings({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  return (
    <Card>
      <SectionTitle title={t('settings.profileSection')} />
      <div className="flex flex-col gap-6">
        <AvatarEditor profile={profile} />
        <IdentityForm profile={profile} />
      </div>
    </Card>
  )
}

function AvatarEditor({ profile }: { profile: Profile }) {
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
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          name={greetingName(profile)}
          src={avatarUrl(profile.avatarPath)}
          className="size-20 text-2xl"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={profile.avatarPath ? t('profile.changePhoto') : t('profile.addPhoto')}
          className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-4 border-surface bg-accent text-accent-fg transition-transform active:scale-90 disabled:opacity-70"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-3.5" aria-hidden />
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
      <div className="flex min-w-0 flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-full px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          {profile.avatarPath ? t('profile.changePhoto') : t('profile.addPhoto')}
        </button>
        {profile.avatarPath && (
          <button
            type="button"
            onClick={() => void onRemove()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted hover:bg-surface-2 hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t('profile.removePhoto')}
          </button>
        )}
        {error && <ErrorText>{error}</ErrorText>}
      </div>
    </div>
  )
}

function IdentityForm({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [username, setUsername] = useState(profile.username)
  const [saved, setSaved] = useState(false)

  const normalizedUsername = username.trim().toLowerCase()
  const dirty =
    displayName.trim() !== (profile.displayName ?? '') || normalizedUsername !== profile.username

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        { json: { displayName: displayName.trim() || null, username: normalizedUsername } },
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
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
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

      <ErrorText>{save.error}</ErrorText>
      <SaveButton pending={save.pending} dirty={dirty} saved={saved}>
        {t('settings.saveProfile')}
      </SaveButton>
    </form>
  )
}

/** Main goal: drives the calorie targets, the diet and the coach's advice. */
export function GoalSettings({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const [goal, setGoal] = useState<Goals['primary']>(profile.goals.primary)
  const [saved, setSaved] = useState(false)
  const dirty = goal !== profile.goals.primary

  const save = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.profile.$patch(
        { json: { goals: goal ? { ...profile.goals, primary: goal } : profile.goals } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await save.run()
    if (result) {
      setProfile(result.profile)
      setSaved(true)
    }
  }

  return (
    <Card id="goal" className="scroll-mt-24">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
        <fieldset>
          <SectionTitle title={t('settings.goalSection')} description={t('profile.mainGoalHelp')} />
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
                      save.reset()
                      setSaved(false)
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
        <SaveButton pending={save.pending} dirty={dirty} saved={saved}>
          {t('settings.saveGoal')}
        </SaveButton>
      </form>
    </Card>
  )
}

function SaveButton({
  pending,
  dirty,
  saved,
  children,
}: {
  pending: boolean
  dirty: boolean
  saved: boolean
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <Button type="submit" loading={pending} disabled={!dirty && !pending}>
      {saved && !dirty ? (
        <>
          <Check className="size-4" aria-hidden />
          {t('profile.saved')}
        </>
      ) : pending ? (
        t('profile.saving')
      ) : (
        children
      )}
    </Button>
  )
}
