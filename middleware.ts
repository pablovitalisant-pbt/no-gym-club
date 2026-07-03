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

  const PROTECTED_PATHS = ['/dashboard', '/assessment', '/session', '/exercises'];
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname.startsWith(`/${locale}${path}`),
  );

  if (isProtected) {
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

  // 3. Locale detection fix: normalize es-* variants (es-419, es-MX, etc.)
  //    next-intl lookup strategy does exact matching — es-419 ≠ es
  //    Check ALL languages in Accept-Language, not just the first
  const localeFromPath = pathname.split('/')[1];
  const hasLocalePrefix = (locales as readonly string[]).includes(localeFromPath);
  if (!hasLocalePrefix) {
    const acceptLang = request.headers.get('accept-language') || '';
    const hasSpanish = acceptLang.split(',').some((lang) => {
      const [code] = lang.trim().split(';');
      return code.trim().startsWith('es');
    });
    if (hasSpanish) {
      const newPath = pathname === '/' ? '/es' : `/es${pathname}`;
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }

  // 4. Enrutar por locale — next-intl maneja /es /en
  const response = intlMiddleware(request);

  // 5. Copiar cookies de sesion al response de i18n
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value);
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
