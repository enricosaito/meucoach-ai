import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">My Coach</h1>
        <p className="text-slate-600">Sign in with a magic link. No password needed.</p>
      </div>
      <LoginForm linkError={error === 'link'} />
    </main>
  )
}
