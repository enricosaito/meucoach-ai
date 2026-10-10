import { getTranslator } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { ProfileView } from './profile-view'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.profile') }
}

export default function ProfilePage() {
  return <ProfileView />
}
