import 'server-only'
import { createTranslator, LOCALE_COOKIE, resolveLocale, type Locale } from '@mycoach/i18n'
import { cookies, headers } from 'next/headers'

/** UI locale for this request: saved cookie → browser language → pt-BR. */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get('accept-language'))
}

export async function getTranslator() {
  return createTranslator(await getLocale())
}
