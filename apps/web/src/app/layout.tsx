import { I18nProvider } from '@/lib/i18n/client'
import { getLocale, getTranslator } from '@/lib/i18n/server'
import { dark, light } from '@mycoach/brand'
import type { Metadata, Viewport } from 'next'
import { Archivo, Manrope } from 'next/font/google'
import './globals.css'

// Brand fonts (packages/brand typography): Manrope for UI text, Archivo Expanded (wdth 125) for
// display text and big numbers. latin-ext covers Portuguese diacritics.
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope' })
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-archivo',
})

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
    <html lang={locale} className={`${manrope.variable} ${archivo.variable}`}>
      <body className="min-h-dvh font-sans">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  )
}
