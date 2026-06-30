import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

  // 2. Auth guard: redirigir rutas protegidas si no hay sesion
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || defaultLocale;

  if (pathname.startsWith(`/${locale}/dashboard`)) {
    // ponytail: sin credenciales, redirigir a login (mismo patron que updateSession)
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // no-op: el guard solo lee, no escribe cookies
          },
        },
      },
    );

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.redirect(
        new URL(`/${locale}/login`, request.url),
      );
    }
  }

  // 3. Enrutar por locale — next-intl maneja /es /en
  const response = intlMiddleware(request);

  // 4. Copiar cookies de sesion al response de i18n
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value);
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
