'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { AtSign, Lock, ArrowRight } from 'lucide-react';
import { useUiFlag } from '@/components/shadcn/ui-flag';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Button } from '@/components/shadcn/button';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const shadcn = useUiFlag();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input pl-xl pr-sm py-md text-on-surface font-mono-data uppercase placeholder:text-on-surface-variant/30 transition-all duration-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-base">{t('login')}</h2>
      {/* Email Field */}
      <div className="space-y-xs">
        {shadcn ? (
          <>
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative">
              <AtSign size={20} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </>
        ) : (
          <>
            <label className="block font-label-bold text-label-bold text-on-surface uppercase" htmlFor="email">
              {t('email')}
            </label>
            <div className="relative">
              <AtSign size={20} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder={t('emailPlaceholder')}
              />
            </div>
          </>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-xs">
        {shadcn ? (
          <>
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock size={20} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
          </>
        ) : (
          <>
            <label className="block font-label-bold text-label-bold text-on-surface uppercase" htmlFor="password">
              {t('password')}
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="********"
              />
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Submit */}
      <div className="pt-base space-y-sm">
        {/* ponytail: boton nativo local — Button.tsx pisa su className (bug fuera de este slice) */}
        {shadcn ? (
          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full gap-2 bg-accent text-surface-900 font-headline-md text-headline-md uppercase"
          >
            {loading ? '...' : t('loginButton')}
            <ArrowRight size={20} />
          </Button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 min-h-[56px] px-6 py-3 bg-accent text-surface-900 font-headline-md text-headline-md uppercase transition-colors hover:bg-accent/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('loginButton')}
            <ArrowRight size={20} />
          </button>
        )}

        <div className="flex flex-col items-center gap-sm mt-md">
          <Link
            href="/signup"
            className="font-label-bold text-label-bold text-primary hover:text-primary-container transition-colors uppercase border-b border-transparent hover:border-primary-container"
          >
            {t('signup')}
          </Link>
        </div>
      </div>
    </form>
  );
}
