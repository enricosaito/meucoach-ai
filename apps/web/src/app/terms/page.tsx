import { LegalPage } from '@/components/legal-page'
import { LEGAL } from '@/content/legal'
import { getLocale, getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.terms') }
}

export default async function TermsPage() {
  return <LegalPage document={LEGAL.terms[await getLocale()]} />
}
