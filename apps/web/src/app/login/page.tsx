import { Logo, LogoMark } from '@/components/ui'
import { Flame, MessageCircle, Target } from 'lucide-react'
import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

const HIGHLIGHTS = [
  { icon: Flame, text: 'Know exactly how much energy your body uses' },
  { icon: Target, text: 'Advice shaped around your goal' },
  { icon: MessageCircle, text: 'A coach that answers any time' },
]

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-accent p-12 text-accent-fg lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />
        <span className="relative inline-flex items-center gap-2 text-lg font-semibold">
          <LogoMark className="size-9 bg-accent-fg text-accent" />
          My Coach
        </span>
        <div className="relative">
          <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
            Small, steady steps. Coached the whole way.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] opacity-90">
                <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm animate-rise-in">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight lg:mt-0">Welcome back</h1>
          <p className="mt-1.5 text-[15px] text-muted">Sign in to continue with your coach.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  )
}
