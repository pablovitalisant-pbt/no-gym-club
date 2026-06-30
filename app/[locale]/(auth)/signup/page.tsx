'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('error.passwordMismatch'));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
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

  return (
    <>
      <h1 className="text-xl font-bold text-text-primary">{t('signup')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm text-text-muted" htmlFor="email">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted" htmlFor="password">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted" htmlFor="confirmPassword">
            {t('confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? '...' : t('signupButton')}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-text-muted">
        <a href="/login" className="text-accent hover:underline">
          {t('login')}
        </a>
      </p>
    </>
  );
}
