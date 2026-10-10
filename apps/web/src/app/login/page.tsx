import { LanguageSwitch } from '@/components/language-switch'
import { Logo, LogoMark } from '@/components/ui'
import { getTranslator } from '@/lib/i18n/server'
import type { MessageKey } from '@mycoach/i18n'
import { Flame, MessageCircle, Target, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './login-form'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return { title: t('meta.signIn') }
}

const HIGHLIGHTS: { icon: LucideIcon; text: MessageKey }[] = [
  { icon: Flame, text: 'auth.highlightEnergy' },
  { icon: Target, text: 'auth.highlightGoal' },
  { icon: MessageCircle, text: 'auth.highlightCoach' },
]

export default async function LoginPage() {
  const { t } = await getTranslator()
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
          <LogoMark className="size-9 bg-accent-fg text-accent-text" />
          {t('common.appName')}
        </span>
        <div className="relative">
          <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
            {t('auth.heroTitle')}
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] opacity-90">
                <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                {t(text)}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative flex flex-col justify-center px-6 py-12 sm:px-12">
        <LanguageSwitch className="absolute top-5 right-5 sm:top-6 sm:right-8" />
        <div className="mx-auto w-full max-w-sm animate-rise-in">
          <div className="lg:hidden">
            <Logo name={t('common.appName')} />
          </div>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight lg:mt-0">
            {t('auth.welcome')}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted">{t('auth.subtitle')}</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-8 flex justify-center gap-4 text-xs text-muted">
            <Link href="/terms" className="hover:text-fg">
              {t('legal.terms')}
            </Link>
            <Link href="/privacy" className="hover:text-fg">
              {t('legal.privacy')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
