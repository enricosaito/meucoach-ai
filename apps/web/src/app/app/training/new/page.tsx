import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { PlanWizard } from './plan-wizard'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.newPlan') }
}

export default function NewPlanPage() {
  return <PlanWizard />
}
