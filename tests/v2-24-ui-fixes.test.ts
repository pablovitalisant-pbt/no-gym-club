import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf-8');

const landing = read('app/[locale]/page.tsx');
const login = read('app/[locale]/(auth)/login/page.tsx');
const signup = read('app/[locale]/(auth)/signup/page.tsx');
const css = read('app/globals.css');
const es = JSON.parse(read('messages/es.json'));
const en = JSON.parse(read('messages/en.json'));
const flags = JSON.parse(read('config/feature-flags.json'));

function palette(theme: 'light' | 'dark'): Record<string, string> {
  const m = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`));
  const vars: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split(';')) {
    const decl = line.match(/--c-([a-z0-9-]+):\s*([\d ]+)/);
    if (decl) vars[decl[1]] = decl[2].trim();
  }
  return vars;
}

function luminance(channels: string): number {
  const [r, g, b] = channels.split(/\s+/).map(Number).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('v2-24 — barra de estadisticas del hero en movil', () => {
  it('fluye debajo de los botones y solo es absolute desde md', () => {
    expect(landing).toContain("getFlag('landing_hero_mobile_bar')");
    expect(landing).toContain('static md:absolute md:bottom-0');
    // la barra ya no arranca con posicionamiento absoluto en movil
    expect(landing).not.toMatch(/className="absolute bottom-0 left-0 w-full brutalist-border/);
  });

  it('flag landing_hero_mobile_bar existe y esta en false', () => {
    expect(flags).toHaveProperty('landing_hero_mobile_bar');
    expect(flags.landing_hero_mobile_bar).toBe(false);
  });
});

describe('v2-24 — trazo de "CLUB" legible', () => {
  it('usa token propio con contraste >= 3:1 sobre el fondo en ambos temas', () => {
    const dark = palette('dark');
    const light = palette('light');
    expect(dark['text-outline'], 'token ausente en tema oscuro').toBeDefined();
    expect(light['text-outline'], 'token ausente en tema claro').toBeDefined();
    expect(ratio(dark['text-outline'], dark.background)).toBeGreaterThanOrEqual(3);
    expect(ratio(light['text-outline'], light.background)).toBeGreaterThanOrEqual(3);
  });

  it('.text-outline traza con --c-text-outline (no con --c-border)', () => {
    expect(css).toMatch(
      /\.text-outline\s*\{[^}]*-webkit-text-stroke:\s*1px rgb\(var\(--c-text-outline\)\)/,
    );
    expect(css).not.toMatch(
      /\.text-outline\s*\{[^}]*-webkit-text-stroke:\s*1px rgb\(var\(--c-border\)\)/,
    );
  });
});

describe('v2-24 — boton submit de login/signup', () => {
  it.each([
    ['login', login],
    ['signup', signup],
  ])('%s: boton primario, fila unica y alto tactil >= 56px', (_, src) => {
    const tag = src.match(/<button[^>]*>/)?.[0] ?? '';
    expect(tag).toContain('type="submit"');
    expect(tag).toContain('inline-flex');
    expect(tag).toContain('items-center');
    expect(tag).toContain('justify-center');
    expect(tag).toContain('bg-accent');
    expect(tag).toContain('min-h-[56px]');
    expect(src).toContain('<ArrowRight size={20}');
    // no depende del Button compartido (bug de className fuera de este slice)
    expect(src).not.toContain('components/ui/Button');
  });
});

describe('v2-24 — placeholder de email por i18n', () => {
  it.each([
    ['login', login],
    ['signup', signup],
  ])('%s usa t(emailPlaceholder) y no el literal', (_, src) => {
    expect(src).toContain("placeholder={t('emailPlaceholder')}");
    expect(src).not.toContain('OPERATOR@NOGYMCLUB.COM');
  });

  it('auth.emailPlaceholder existe y difiere entre ES y EN', () => {
    expect(es.auth.emailPlaceholder).toBeTruthy();
    expect(en.auth.emailPlaceholder).toBeTruthy();
    expect(es.auth.emailPlaceholder).not.toBe(en.auth.emailPlaceholder);
  });
});
