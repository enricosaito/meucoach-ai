'use client'

import { Avatar, cx } from '@/components/ui'
import { avatarUrl } from '@/lib/avatar'
import { useI18n } from '@/lib/i18n/client'
import { greetingName } from '@mycoach/core/profile/contracts'
import type { MessageKey } from '@mycoach/i18n'
import { Dumbbell, House, MessageCircle, Salad, UserRound, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMe } from './me-context'

const NAV: { href: string; label: MessageKey; icon: LucideIcon }[] = [
  { href: '/app', label: 'nav.home', icon: House },
  { href: '/app/training', label: 'nav.training', icon: Dumbbell },
  { href: '/app/diet', label: 'nav.diet', icon: Salad },
  { href: '/app/coach', label: 'nav.coach', icon: MessageCircle },
  { href: '/app/profile', label: 'nav.profile', icon: UserRound },
]

function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href)
}

/**
 * Mobile-first chrome: no top bar on phones (screens start with their own title and the avatar
 * floats top-right), a bottom tab bar for navigation. Desktop gets a slim top bar instead.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { t } = useI18n()
  // Profile screens have the settings cog in that corner, and the avatar would link to itself.
  const onProfile = pathname.startsWith('/app/profile')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 hidden border-b border-line/70 bg-bg/80 backdrop-blur-xl sm:block">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <nav aria-label={t('nav.main')} className="flex items-center gap-1">
            {NAV.slice(0, 4).map(({ href, label }) => (
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
          <ProfileLink />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-10 sm:pb-16">
        {!onProfile && (
          <div className="absolute top-4 right-4 z-10 sm:hidden">
            <ProfileLink />
          </div>
        )}
        {children}
      </main>

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
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

function ProfileLink() {
  const { me } = useMe()
  const { t } = useI18n()
  return (
    <Link
      href="/app/profile"
      aria-label={t('nav.profileLink')}
      className="block rounded-full transition-transform active:scale-95"
    >
      <Avatar
        name={me ? greetingName(me.profile) : null}
        src={avatarUrl(me?.profile.avatarPath)}
        className="size-10 text-sm"
      />
    </Link>
  )
}
