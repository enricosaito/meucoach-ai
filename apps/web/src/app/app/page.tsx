import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { HomeView } from './home-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.home') }
}

export default function HomePage() {
  return <HomeView />
}
