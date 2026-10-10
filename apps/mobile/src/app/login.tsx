import { Eye, EyeOff } from 'lucide-react-native'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LogoMark } from '../components/logo'
import { Button, ErrorText, Txt } from '../components/ui'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { radius, space, useColors } from '../theme'

/** Email + password sign-in (same accounts as the web app). */
export default function LoginScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setPending(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setPending(false)
    // On success the session listener swaps this screen for the tabs.
    if (authError) {
      setError(authError.status === 400 ? t('auth.invalidCredentials') : t('errors.network'))
    }
  }

  const input = [
    styles.input,
    { backgroundColor: colors.surface, borderColor: colors.line, color: colors.fg },
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + space.xxl * 3, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <LogoMark size={52} />
        <View style={{ gap: space.xs }}>
          <Txt variant="display">{t('auth.welcome')}</Txt>
          <Txt muted>{t('auth.subtitle')}</Txt>
        </View>

        <View style={{ gap: space.md }}>
          <Txt variant="label">{t('auth.email')}</Txt>
          <TextInput
            style={input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Txt variant="label">{t('auth.password')}</Txt>
          <View>
            <TextInput
              style={[input, { paddingRight: 52 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void signIn()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              onPress={() => {
                setShowPassword((s) => !s)
              }}
              style={styles.eye}
              hitSlop={8}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.muted} />
              ) : (
                <Eye size={20} color={colors.muted} />
              )}
            </Pressable>
          </View>
        </View>

        <ErrorText>{error}</ErrorText>

        <Button
          onPress={() => void signIn()}
          loading={pending}
          disabled={!email || !password}
          style={{ alignSelf: 'stretch' }}
        >
          {pending ? t('auth.submitting') : t('auth.submit')}
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: space.xxl, gap: space.xxl },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    fontSize: 16,
  },
  eye: { position: 'absolute', right: 16, top: 16 },
})
