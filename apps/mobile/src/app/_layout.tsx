import '../lib/polyfills'

import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { I18nProvider, useI18n } from '../lib/i18n'
import { MeProvider } from '../lib/me'
import { SessionProvider, useSession } from '../lib/session'
import { useColors } from '../theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  return (
    <I18nProvider>
      <SessionProvider>
        <MeProvider>
          <RootStack />
        </MeProvider>
      </SessionProvider>
    </I18nProvider>
  )
}

/** Signed-out users only see the login screen; signed-in users only see the tabs. */
function RootStack() {
  const { session, ready } = useSession()
  const { t } = useI18n()
  const colors = useColors()

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: t('settings.title'),
              headerBackTitle: t('nav.profile'),
              headerTintColor: colors.accent,
              headerTitleStyle: { color: colors.fg },
              headerStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
