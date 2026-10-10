'use client'

import { Avatar, cx, Logo } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import type { MessageKey } from '@mycoach/i18n'
import { Dumbbell, House, MessageCircle, UserRound, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMe } from './me-context'

const NAV: { href: string; label: MessageKey; icon: LucideIcon }[] = [
  { href: '/app', label: 'nav.home', icon: House },
  { href: '/app/training', label: 'nav.training', icon: Dumbbell },
  { href: '/app/coach', label: 'nav.coach', icon: MessageCircle },
  { href: '/app/profile', label: 'nav.profile', icon: UserRound },
]

function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href)
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { me } = useMe()
  const { t } = useI18n()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/app" className="rounded-xl" aria-label={t('nav.homeLink')}>
            <Logo name={t('common.appName')} />
          </Link>

          <nav aria-label={t('nav.main')} className="hidden items-center gap-1 sm:flex">
            {NAV.slice(0, 3).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={cx(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive(pathname, href)
                    ? 'bg-surface-2 text-fg'
                    : 'text-muted hover:bg-surface-2/60 hover:text-fg',
                )}
              >
                {t(label)}
              </Link>
            ))}
          </nav>

          <Link
            href="/app/profile"
            aria-label={t('nav.profileLink')}
            className="rounded-full transition-transform active:scale-95"
          >
            <Avatar name={me?.profile.displayName ?? null} />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-10 sm:pb-16">
        {children}
      </main>

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    active ? 'text-accent' : 'text-muted',
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                  {t(label)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
