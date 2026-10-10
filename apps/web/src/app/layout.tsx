import { I18nProvider } from '@/lib/i18n/client'
import { getLocale, getTranslator } from '@/lib/i18n/server'
import { dark, light } from '@mycoach/brand'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator()
  return {
    title: { default: t('common.appName'), template: `%s · ${t('common.appName')}` },
    description: t('meta.description'),
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: light.background },
    { media: '(prefers-color-scheme: dark)', color: dark.background },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={geist.variable}>
      <body className="min-h-dvh font-sans">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  )
}
