import '../lib/polyfills'

import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AppearanceProvider, useAppearance } from '../lib/appearance'
import { useBrandFonts } from '../lib/fonts'
import { font } from '../lib/typography'
import { I18nProvider, useI18n } from '../lib/i18n'
import { MeProvider } from '../lib/me'
import { SessionProvider, useSession } from '../lib/session'
import { useColors, useScheme } from '../theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <I18nProvider>
        <SessionProvider>
          <MeProvider>
            <RootStack />
          </MeProvider>
        </SessionProvider>
      </I18nProvider>
    </AppearanceProvider>
  )
}

/** Signed-out users only see the login screen; signed-in users only see the tabs. */
function RootStack() {
  const { session, ready: sessionReady } = useSession()
  const fontsReady = useBrandFonts()
  const appearance = useAppearance()
  const ready = sessionReady && fontsReady && appearance.ready
  const { t } = useI18n()
  const colors = useColors()
  const scheme = useScheme()

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  // Pushed screens: native header with a back button, in the app's colors.
  const pushed = {
    headerShown: true,
    headerTintColor: colors.accentText,
    headerTitleStyle: { color: colors.textPrimary, ...font('ui', 700) },
    headerBackTitleStyle: font('ui', 500),
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{ ...pushed, title: t('settings.title'), headerBackTitle: t('nav.profile') }}
          />
          <Stack.Screen
            name="new-plan"
            options={{ ...pushed, title: t('meta.newPlan'), headerBackTitle: t('nav.training') }}
          />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
