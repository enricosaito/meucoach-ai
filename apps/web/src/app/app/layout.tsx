import { getCurrentUserId } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from './app-shell'
import { MeProvider } from './me-context'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <MeProvider>
      <AppShell>{children}</AppShell>
    </MeProvider>
  )
}
