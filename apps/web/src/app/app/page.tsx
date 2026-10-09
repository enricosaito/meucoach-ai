import { getCurrentUserId } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Dashboard } from './dashboard'

export default async function AppPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Coach</h1>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-slate-600 underline" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <Dashboard />
    </main>
  )
}
