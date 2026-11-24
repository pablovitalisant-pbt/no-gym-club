import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

const DICT: Record<string, string> = {
  'auth.login': 'Entrar',
  'auth.signup': 'Crear cuenta',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirmar',
  'auth.emailPlaceholder': 'tu@email.com',
  'auth.loginButton': 'Entrar',
  'auth.signupButton': 'Crear cuenta',
  'auth.error.passwordMismatch': 'No coinciden',
  'assessment.stepOf': 'Paso {current} de {total}',
  'assessment.profile.title': 'Tu perfil',
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, vals?: Record<string, unknown>) =>
    (DICT[`${ns}.${key}`] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vals?.[k] ?? '')),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  }),
}));

vi.mock('@/app/[locale]/(app)/assessment/actions', () => ({
  saveProfile: vi.fn(),
}));

import { UiFlagProvider } from '../components/shadcn/ui-flag';
import { Progress } from '../components/shadcn/progress';
import { Button } from '../components/shadcn/button';
import LoginPage from '../app/[locale]/(auth)/login/page';
import SignupPage from '../app/[locale]/(auth)/signup/page';
import { AssessmentForm } from '../app/[locale]/(app)/assessment/assessment-form';

const root = resolve(__dirname, '..');

function inputs(html: string): string[] {
  return [...html.matchAll(/<input[^>]*class="([^"]*)"/g)].map((m) => m[1]);
}

const TODAY_INPUT = 'pl-xl pr-sm py-md';

describe('v2-27 — login/signup con shadcn_ui encendido', () => {
  it('login usa Input shadcn (alto tactil >=56px y estilo del proyecto)', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={true}>
        <LoginPage />
      </UiFlagProvider>,
    );
    const cls = inputs(html);
    expect(cls).toHaveLength(2);
    for (const c of cls) {
      expect(c).toContain('min-h-[56px]');
      expect(c).toContain('bg-surface-900');
      expect(c).toContain('brutalist-border');
    }
  });

  it('login usa Label shadcn (htmlFor apuntando al input)', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={true}>
        <LoginPage />
      </UiFlagProvider>,
    );
    const labels = [...html.matchAll(/<label[^>]*>/g)].map((m) => m[0]);
    for (const id of ['email', 'password']) {
      const tag = labels.find((l) => l.includes(`for="${id}"`));
      expect(tag, `label ${id}`).toBeDefined();
      expect(tag).toContain('font-label-bold');
    }
  });

  it('submit usa Button shadcn naranja con texto oscuro, uppercase y alto 56', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={true}>
        <LoginPage />
      </UiFlagProvider>,
    );
    const btn = html.match(/<button[^>]*type="submit"[^>]*class="([^"]*)"/)?.[1] ?? '';
    expect(btn).toContain('bg-accent');
    expect(btn).toContain('text-surface-900');
    expect(btn).toContain('uppercase');
    expect(btn).toContain('h-14');
    expect(btn).toContain('rounded-none');
    expect(btn).not.toContain('hover:bg-accent');
  });

  it('signup con flag encendido usa 3 Input shadcn', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={true}>
        <SignupPage />
      </UiFlagProvider>,
    );
    const cls = inputs(html);
    expect(cls).toHaveLength(3);
    for (const c of cls) expect(c).toContain('min-h-[56px]');
  });
});

describe('v2-27 — con shadcn_ui apagado el markup es el de hoy', () => {
  it('login conserva input nativo (sin min-h) y boton nativo', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={false}>
        <LoginPage />
      </UiFlagProvider>,
    );
    const cls = inputs(html);
    expect(cls).toHaveLength(2);
    for (const c of cls) {
      expect(c).toContain(TODAY_INPUT);
      expect(c).not.toContain('min-h-[56px]');
    }
    const btn = html.match(/<button[^>]*type="submit"[^>]*class="([^"]*)"/)?.[1] ?? '';
    expect(btn).toContain('hover:bg-accent/90');
    expect(btn).toContain('min-h-[56px]');
    expect(btn).not.toContain('rounded-md');
  });

  it('signup conserva input nativo y sin boton shadcn', () => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={false}>
        <SignupPage />
      </UiFlagProvider>,
    );
    const cls = inputs(html);
    expect(cls).toHaveLength(3);
    for (const c of cls) expect(c).not.toContain('min-h-[56px]');
  });

  it('sin provider el default es apagado', () => {
    const html = renderToStaticMarkup(<LoginPage />);
    for (const c of inputs(html)) expect(c).not.toContain('min-h-[56px]');
  });
});

describe('v2-27 — Progress accesible', () => {
  it('expone role progressbar, aria-valuenow/min/max y ancho en %', () => {
    const html = renderToStaticMarkup(<Progress value={2} max={5} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain('width:40%');
  });

  it('clampea 0..100 el ancho', () => {
    expect(renderToStaticMarkup(<Progress value={9} max={5} />)).toContain('width:100%');
    expect(renderToStaticMarkup(<Progress value={-1} max={5} />)).toContain('width:0%');
  });

  it('evaluacion usa Progress solo con el flag encendido', () => {
    const on = renderToStaticMarkup(<AssessmentForm shadcnUi />);
    expect(on).toContain('role="progressbar"');
    expect(on).toContain('aria-valuenow="1"');
    expect(on).toContain('aria-valuemax="5"');

    const off = renderToStaticMarkup(<AssessmentForm />);
    expect(off).not.toContain('role="progressbar"');
  });
});

describe('v2-27-fix — boton cuadrado y en negrita', () => {
  it('la base de Button no trae rounded-md (diseno cuadrado)', () => {
    const html = renderToStaticMarkup(<Button>Entrar</Button>);
    const cls = html.match(/class="([^"]*)"/)?.[1] ?? '';
    expect(cls).not.toContain('rounded-md');
    expect(cls).toContain('rounded-none');
  });

  it.each([
    ['login', LoginPage],
    ['signup', SignupPage],
  ])('submit de %s con flag on: font-bold y sin font-medium', (_name, Page) => {
    const html = renderToStaticMarkup(
      <UiFlagProvider value={true}>
        <Page />
      </UiFlagProvider>,
    );
    const btn = html.match(/<button[^>]*type="submit"[^>]*class="([^"]*)"/)?.[1] ?? '';
    expect(btn).toContain('font-bold');
    expect(btn).not.toContain('font-medium');
  });
});

describe('v2-27 — primario naranja sobrevive a cn', () => {
  it('className bg-accent + text-surface-900 gana a la variante default', () => {
    const html = renderToStaticMarkup(
      <Button type="submit" className="h-14 w-full bg-accent text-surface-900 uppercase">Entrar</Button>,
    );
    const cls = html.match(/class="([^"]*)"/)?.[1] ?? '';
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('text-surface-900');
    expect(cls).toContain('h-14');
    expect(cls).not.toMatch(/(^|\s)bg-primary(\s|$)/);
    expect(cls).not.toContain('text-primary-foreground');
  });

  it('(auth)/layout.tsx entrega el flag shadcn_ui via UiFlagProvider', () => {
    const raw = readFileSync(resolve(root, 'app/[locale]/(auth)/layout.tsx'), 'utf-8');
    expect(raw).toContain('UiFlagProvider');
    expect(raw).toContain("getFlag('shadcn_ui')");
  });
});
