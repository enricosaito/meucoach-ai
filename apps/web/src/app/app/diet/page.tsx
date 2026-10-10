import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { DietView } from './diet-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.diet') }
}

export default function DietPage() {
  return <DietView />
}
