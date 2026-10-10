import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { DietWizard } from './diet-wizard'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.newDiet') }
}

export default function NewDietPage() {
  return <DietWizard />
}
