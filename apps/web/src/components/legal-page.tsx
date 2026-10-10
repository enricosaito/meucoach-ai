import { LanguageSwitch } from '@/components/language-switch'
import { Logo } from '@/components/ui'
import type { LegalDocument } from '@/content/legal'
import { getTranslator } from '@/lib/i18n/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export async function LegalPage({ document }: { document: LegalDocument }) {
  const { t, formatDate } = await getTranslator()
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('legal.back')}
        </Link>
        <LanguageSwitch />
      </header>
      <div className="mt-8">
        <Logo name={t('common.appName')} />
      </div>
      <article className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">{document.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('legal.lastUpdated', { date: formatDate(document.updated) })}
        </p>
        <p className="mt-4 rounded-2xl bg-energy-soft px-4 py-3 text-sm">
          {t('legal.draftNotice')}
        </p>
        <p className="mt-6 text-[15px] leading-relaxed">{document.intro}</p>
        {document.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-[15px] leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
      <footer className="mt-12 flex gap-4 border-t border-line pt-6 text-sm">
        <Link href="/privacy" className="text-muted hover:text-fg">
          {t('legal.privacy')}
        </Link>
        <Link href="/terms" className="text-muted hover:text-fg">
          {t('legal.terms')}
        </Link>
      </footer>
    </div>
  )
}
