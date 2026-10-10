// Imported first by the root layout. React Native lacks a few web APIs the shared packages use.
import 'react-native-url-polyfill/auto'
import { randomUUID } from 'expo-crypto'

// @mycoach/api-client creates idempotency keys with crypto.randomUUID; Hermes has no Web Crypto.
const g = globalThis as { crypto?: { randomUUID?: () => string } }
g.crypto ??= {}
g.crypto.randomUUID ??= randomUUID
