import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Copia cookies con sus opciones completas (path/maxAge/sameSite/...) — sin
// esto, la sesion de Supabase se degrada a cookie de sesion y muere al cerrar
// el navegador. from/to son los cookie stores de NextResponse.
type CookieStore = Pick<NextResponse['cookies'], 'getAll'>;

export function copyCookies(from: { cookies: CookieStore }, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
}

export async function updateSession(request: NextRequest) {
  // ponytail: sin credenciales, no hacer nada — NextResponse.next sin tocar cookies
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, maxAge: options.maxAge ?? 60 * 60 * 24 * 100 }),
          );
        },
      },
    },
  );

  // refresca el token — no redirige, solo mantiene la sesion viva
  await supabase.auth.getUser();

  return supabaseResponse;
}
