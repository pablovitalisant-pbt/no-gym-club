import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { copyCookies } from '@/lib/supabase/middleware';
import { isProtectedPath } from '@/middleware';

describe('v3-01 — la sesion se pierde', () => {
  it('copyCookies conserva maxAge y path de la cookie', () => {
    const from = NextResponse.next();
    from.cookies.set('sb-x', 'token', { path: '/', maxAge: 8640000, sameSite: 'lax' });

    const to = NextResponse.next();
    copyCookies(from, to);

    const copied = to.cookies.get('sb-x');
    expect(copied).toBeDefined();
    expect(copied?.value).toBe('token');
    expect(copied?.maxAge).toBe(8640000);
    expect(copied?.path).toBe('/');
  });

  it('/es/community queda protegido', () => {
    expect(isProtectedPath('/es/community', 'es')).toBe(true);
    expect(isProtectedPath('/en/community', 'en')).toBe(true);
  });

  it('las rutas (app) y (session) existentes siguen protegidas', () => {
    ['/dashboard', '/assessment', '/session', '/exercises', '/weekly-report', '/progress', '/settings'].forEach(
      (route) => expect(isProtectedPath(`/es${route}`, 'es')).toBe(true),
    );
  });

  it('rutas publicas no se protegen', () => {
    expect(isProtectedPath('/es', 'es')).toBe(false);
    expect(isProtectedPath('/es/login', 'es')).toBe(false);
    expect(isProtectedPath('/es/signup', 'es')).toBe(false);
  });
});
