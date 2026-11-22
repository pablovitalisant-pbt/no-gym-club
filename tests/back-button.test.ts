import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));

const root = resolve(__dirname, '..');

describe('BackButton — decision de volver', () => {
  it('vuelve si hay historial propio', async () => {
    const { shouldGoBack } = await import('../components/ui/BackButton');
    expect(shouldGoBack(3, 'http://localhost:3123/recipes', 'http://localhost:3123')).toBe(true);
  });

  it('no vuelve sin historial previo', async () => {
    const { shouldGoBack } = await import('../components/ui/BackButton');
    expect(shouldGoBack(1, 'http://localhost:3123/exercises', 'http://localhost:3123')).toBe(false);
  });

  it('no vuelve si el referrer es externo o vacio', async () => {
    const { shouldGoBack } = await import('../components/ui/BackButton');
    expect(shouldGoBack(3, 'https://google.com/', 'http://localhost:3123')).toBe(false);
    expect(shouldGoBack(3, '', 'http://localhost:3123')).toBe(false);
  });
});

describe('Detalle de ejercicio usa BackButton con fallback al catalogo', () => {
  it('renderiza BackButton con fallback /exercises y sin link fijo al catalogo', () => {
    const src = readFileSync(
      resolve(root, 'app/[locale]/(app)/exercises/[slug]/page.tsx'),
      'utf-8',
    );
    expect(src).toContain('BackButton');
    expect(src).toMatch(/fallbackHref=/);
    expect(src).toContain('/exercises');
    expect(src).not.toMatch(/<a\s+href=\{`\/\$\{locale\}\/exercises`\}/);
  });
});
