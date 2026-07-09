'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AtSign, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
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
            placeholder="OPERATOR@NOGYMCLUB.COM"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-xs">
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
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Submit */}
      <div className="pt-base space-y-sm">
        <Button
          type="submit"
          disabled={loading}
          iconRight={ArrowRight}
          className="w-full uppercase font-headline-md text-headline-md !py-md active:scale-[0.98]"
        >
          {loading ? '...' : t('loginButton')}
        </Button>

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
