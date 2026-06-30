import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // redirect sin locale — el middleware de next-intl resuelve /es o /en
  return NextResponse.redirect(
    new URL('/dashboard', request.url),
  );
}
