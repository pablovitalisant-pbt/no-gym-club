import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

function classAttr(html: string): string {
  const all = [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]);
  expect(all).toHaveLength(1);
  return all[0];
}

describe('v2-26 — Bug #12: Button no pisa su className', () => {
  it('primary sin className conserva base y variante', () => {
    const html = renderToStaticMarkup(<Button>Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('min-h-[56px]');
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('text-surface-900');
  });

  it('primary con className conserva base, variante y clase propia', () => {
    const html = renderToStaticMarkup(<Button className="mi-clase">Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('text-surface-900');
    expect(cls).toContain('mi-clase');
  });

  it('primary + !text-body-lg conserva text-surface-900', () => {
    const html = renderToStaticMarkup(<Button className="!text-body-lg">Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).toContain('text-surface-900');
    expect(cls).toContain('!text-body-lg');
  });

  it('className del consumidor gana conflictos de tailwind', () => {
    const html = renderToStaticMarkup(<Button className="px-10">Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).toContain('px-10');
    expect(cls).not.toContain('px-6');
  });

  it('secondary con className conserva el borde de la variante', () => {
    const html = renderToStaticMarkup(<Button variant="secondary" className="w-full">Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).toContain('border-2');
    expect(cls).toContain('border-text-primary');
    expect(cls).toContain('w-full');
  });

  it('ghost con className conserva base y variante', () => {
    const html = renderToStaticMarkup(<Button variant="ghost" className="mt-4">Entrar</Button>);
    const cls = classAttr(html);
    expect(cls).not.toContain('bg-accent');
    expect(cls).toContain('border-border');
    expect(cls).toContain('mt-4');
  });

  it('as="a" tambien tiene un solo class con base y variante', () => {
    const html = renderToStaticMarkup(
      <Button as="a" href="/login" className="mi-link">Entrar</Button>,
    );
    expect(html).toContain('href="/login"');
    const cls = classAttr(html);
    expect(cls).toContain('inline-flex');
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('mi-link');
  });
});

describe('v2-26 — cn conoce los fontSize del tema', () => {
  it('conserva color y tamaño custom en el mismo elemento', () => {
    expect(cn('text-surface-900', 'text-body-lg')).toBe('text-surface-900 text-body-lg');
  });
});
