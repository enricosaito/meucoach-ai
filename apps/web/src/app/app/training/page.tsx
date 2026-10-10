import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { TrainingView } from './training-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.training') }
}

export default function TrainingPage() {
  return <TrainingView />
}
