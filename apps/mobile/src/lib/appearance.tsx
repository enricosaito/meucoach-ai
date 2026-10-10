import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Appearance } from 'react-native'

// Light/dark preference: follow the system by default, or force one. Stored on this device only
// (a display preference, not account data). On iOS/Android, Appearance.setColorScheme also
// switches native UI (tab bar, alerts, keyboard); on web the context below does the work.

export type AppearancePreference = 'system' | 'light' | 'dark'

const KEY = 'appearance'

interface AppearanceState {
  preference: AppearancePreference
  setPreference: (preference: AppearancePreference) => void
  /** False until the saved preference is read (the splash screen waits for it). */
  ready: boolean
}

const AppearanceContext = createContext<AppearanceState | null>(null)

function apply(preference: AppearancePreference) {
  // Not implemented by react-native-web.
  if (typeof Appearance.setColorScheme !== 'function') return
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference)
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setPreferenceState(saved)
          apply(saved)
        }
      })
      .finally(() => {
        setReady(true)
      })
  }, [])

  function setPreference(next: AppearancePreference) {
    setPreferenceState(next)
    apply(next)
    void AsyncStorage.setItem(KEY, next)
  }

  return (
    <AppearanceContext.Provider value={{ preference, setPreference, ready }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance(): AppearanceState {
  const value = useContext(AppearanceContext)
  if (!value) throw new Error('useAppearance must be used inside <AppearanceProvider>')
  return value
}

/** The forced scheme, or null when following the system. Safe outside the provider. */
export function useForcedScheme(): 'light' | 'dark' | null {
  const preference = useContext(AppearanceContext)?.preference ?? 'system'
  return preference === 'system' ? null : preference
}
