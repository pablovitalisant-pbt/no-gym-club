import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createIntlMiddleware({
  defaultLocale,
  locales: [...locales],
  localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
  // 1. Refrescar sesion de Supabase — mantiene cookies de auth vivas
  const supabaseResponse = await updateSession(request);

  // 2. Enrutar por locale — next-intl maneja /es /en
  const response = intlMiddleware(request);

  // 3. Copiar cookies de sesion al response de i18n
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value);
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
