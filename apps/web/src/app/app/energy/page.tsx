import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { EnergyView } from './energy-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.energy') }
}

export default function EnergyPage() {
  return <EnergyView />
}
