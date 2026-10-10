import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CoachView } from './coach-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.coach') }
}

export default function CoachPage() {
  return (
    <Suspense>
      <CoachView />
    </Suspense>
  )
}
