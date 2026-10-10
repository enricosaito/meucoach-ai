import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { SettingsView } from './settings-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('settings.title') }
}

export default function SettingsPage() {
  return <SettingsView />
}
