import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { esVoseo } from './helpers/voseo-guard';
import {
  ROTATE_MS,
  advanceIndex,
  shuffle,
  formatElapsed,
} from '../components/plan/GeneratingMessages';

const root = resolve(__dirname, '..');
const read = (f: string) => JSON.parse(readFileSync(resolve(root, f), 'utf-8'));

const get = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (acc, k) => (acc as Record<string, unknown> | undefined)?.[k],
    obj,
  );

describe('Slice v2-19 — mensajes mientras se genera el programa', () => {
  for (const locale of ['es', 'en']) {
    const msgs = get(read(`messages/${locale}.json`), 'dashboard.plan.waiting.messages');

    it(`${locale}: 24 mensajes`, () => {
      expect(Array.isArray(msgs)).toBe(true);
      expect((msgs as string[]).length).toBe(24);
      expect(new Set(msgs as string[]).size).toBe(24);
    });

    it(`${locale}: todos ≤90 caracteres`, () => {
      for (const m of msgs as string[]) {
        expect(typeof m).toBe('string');
        expect(m.length).toBeLessThanOrEqual(90);
      }
    });
  }

  it('es: sin voseo (reusa el guardián)', () => {
    const msgs = get(read('messages/es.json'), 'dashboard.plan.waiting.messages') as string[];
    expect(msgs.filter(esVoseo)).toEqual([]);
  });

  it('rota cada 6 s sin repetir hasta agotar', () => {
    expect(ROTATE_MS).toBe(6000);
    const len = 24;
    const seen = new Set<number>();
    let i = 0;
    for (let n = 0; n < len; n++) {
      expect(seen.has(i)).toBe(false);
      seen.add(i);
      i = advanceIndex(i, len);
    }
    expect(seen.size).toBe(len);
    expect(i).toBe(0);
  });

  it('shuffle es una permutación completa', () => {
    const base = Array.from({ length: 24 }, (_, i) => i);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = shuffle(base, rand);
    expect([...out].sort((a, b) => a - b)).toEqual(base);
  });

  it('formatea el tiempo transcurrido', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(45)).toBe('0:45');
    expect(formatElapsed(125)).toBe('2:05');
  });

  it('reduced-motion: sin clases de animación', () => {
    const src = readFileSync(resolve(root, 'components/plan/GeneratingMessages.tsx'), 'utf-8');
    expect(src).toContain('motion-reduce:transition-none');
    expect(src).toContain('motion-reduce:animate-none');
    expect(src).toContain('aria-live="polite"');
  });
});
