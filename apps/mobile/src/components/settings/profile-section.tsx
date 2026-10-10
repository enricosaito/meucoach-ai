import { greetingName, USERNAME_MAX_LENGTH } from '@mycoach/core/profile/contracts'
import { Camera, Check, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { api, unwrap, writeHeaders } from '../../lib/api'
import { pickAvatar, prepareAvatar, uploadAvatar } from '../../lib/avatar'
import { haptics } from '../../lib/haptics'
import { errorMessage, useI18n } from '../../lib/i18n'
import type { Me } from '../../lib/me'
import { useMe } from '../../lib/me'
import { useWrite } from '../../lib/use-write'
import { space, useColors } from '../../theme'
import { Avatar, Button, Card, ErrorText, Input, Txt } from '../ui'

/** Photo, display name and @username (same rules as the web Settings). */
export function ProfileSection({ profile }: { profile: Me['profile'] }) {
  const { t } = useI18n()
  return (
    <Card style={{ gap: space.xl }}>
      <Txt variant="heading">{t('settings.profileSection')}</Txt>
      <AvatarEditor profile={profile} />
      <IdentityForm profile={profile} />
    </Card>
  )
}

function AvatarEditor({ profile }: { profile: Me['profile'] }) {
  const { t } = useI18n()
  const colors = useColors()
  const { setProfile } = useMe()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change() {
    haptics.tap()
    setError('')
    const asset = await pickAvatar()
    if (!asset) return
    setBusy(true)
    try {
      const body = await prepareAvatar(asset)
      const { path, token } = await unwrap(
        api.me.avatar['upload-url'].$post({}, { headers: writeHeaders() }),
      )
      await uploadAvatar(path, token, body)
      const result = await unwrap(
        api.me.avatar.$put({ json: { path } }, { headers: writeHeaders() }),
      )
      setProfile(result.profile)
      haptics.success()
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    haptics.tap()
    setBusy(true)
    setError('')
    try {
      const result = await unwrap(api.me.avatar.$delete({}, { headers: writeHeaders() }))
      setProfile(result.profile)
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.avatarRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={profile.avatarPath ? t('profile.changePhoto') : t('profile.addPhoto')}
        onPress={() => void change()}
        disabled={busy}
      >
        <Avatar name={greetingName(profile)} path={profile.avatarPath} size={80} />
        <View
          style={[
            styles.cameraBadge,
            { backgroundColor: colors.accent, borderColor: colors.surface },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Camera size={14} color={colors.onAccent} />
          )}
        </View>
      </Pressable>
      <View style={{ flex: 1, gap: space.sm, alignItems: 'flex-start' }}>
        <Pressable onPress={() => void change()} disabled={busy} hitSlop={6}>
          <Txt variant="label" color="accentText">
            {profile.avatarPath ? t('profile.changePhoto') : t('profile.addPhoto')}
          </Txt>
        </Pressable>
        {profile.avatarPath && (
          <Pressable onPress={() => void remove()} disabled={busy} hitSlop={6} style={styles.row}>
            <Trash2 size={14} color={colors.textSecondary} />
            <Txt variant="label" muted>
              {t('profile.removePhoto')}
            </Txt>
          </Pressable>
        )}
        <ErrorText>{error}</ErrorText>
      </View>
    </View>
  )
}

function IdentityForm({ profile }: { profile: Me['profile'] }) {
  const { t } = useI18n()
  const colors = useColors()
  const { setProfile } = useMe()
  const [displayName, setDisplayName] = useState(profile.displayName ?? '')
  const [username, setUsername] = useState(profile.username)
  const [saved, setSaved] = useState(false)

  const normalizedUsername = username.trim().toLowerCase()
  const dirty =
    displayName.trim() !== (profile.displayName ?? '') || normalizedUsername !== profile.username

  const save = useWrite((key) =>
    unwrap(
      api.me.profile.$patch(
        { json: { displayName: displayName.trim() || null, username: normalizedUsername } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  function changed() {
    save.reset()
    setSaved(false)
  }

  async function submit() {
    const result = await save.run()
    if (result) {
      setProfile(result.profile)
      setSaved(true)
      haptics.success()
    }
  }

  return (
    <View style={{ gap: space.lg }}>
      <Input
        label={t('profile.displayName')}
        hint={t('profile.displayNameHelp')}
        value={displayName}
        maxLength={40}
        autoComplete="given-name"
        placeholder={t('profile.displayNamePlaceholder')}
        onChangeText={(value) => {
          setDisplayName(value)
          changed()
        }}
      />
      <Input
        label={t('profile.username')}
        hint={t('profile.usernameHelp')}
        prefix="@"
        value={username}
        maxLength={USERNAME_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        onChangeText={(value) => {
          setUsername(value.replace(/\s/g, ''))
          changed()
        }}
      />
      <ErrorText>{save.error}</ErrorText>
      <Button
        onPress={() => void submit()}
        loading={save.pending}
        disabled={!dirty}
        size="lg"
        style={{ alignSelf: 'stretch' }}
        icon={saved && !dirty ? <Check size={16} color={colors.onAccent} /> : undefined}
      >
        {saved && !dirty ? t('profile.saved') : t('settings.saveProfile')}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
