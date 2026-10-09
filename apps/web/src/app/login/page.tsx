import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">My Coach</h1>
        <p className="text-slate-600">Sign in to continue.</p>
      </div>
      <LoginForm />
    </main>
  )
}
