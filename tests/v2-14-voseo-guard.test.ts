import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));

const VOSEO = /\b(?:tenés|podés|querés|sabés|sentís|elegí|contanos|hacé|tocá|empezá|guardá|registrá|volvé|seleccioná|marcá|respondé|consultá|arrancá|probá|decí|mirá|usá|buscá|poné|andá|vení|salí|escribí|completá|revisá|activá|desactivá|agregá|borrá|cambiá|pedí|repetí|mantené)\b/i;

// Imperativos voseantes con tilde final (Intentá, Probá, Elegí, Hacé...).
const TILDE_FINAL = /[áéí]$/i;
// Palabras con tilde final que NO son imperativos voseantes.
const PERMITIDAS = new Set([
  'está', 'qué', 'sí', 'él', 'más', 'entrené', 'esté', 'aquí', 'así', 'ahí', 'allí',
]);

function tildesVoseantes(texto: string): string[] {
  return texto
    .split(/[^\p{L}]+/u)
    .filter((w) => TILDE_FINAL.test(w) && !PERMITIDAS.has(w.toLowerCase()));
}

function strings(obj: unknown, path = ''): Array<[string, string]> {
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === 'string') return [[p, v] as [string, string]];
    if (v && typeof v === 'object') return strings(v, p);
    return [];
  });
}

describe('Slice v2-14 — español neutro sin voseo', () => {
  it('messages/es.json no contiene formas voseantes', () => {
    const bad = strings(es).filter(([, v]) => VOSEO.test(v));
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it('messages/es.json no contiene imperativos voseantes con tilde final', () => {
    const bad = strings(es)
      .filter(([, v]) => tildesVoseantes(v).length > 0)
      .map(([k, v]) => `${k}: ${tildesVoseantes(v).join(', ')}`);
    expect(bad).toEqual([]);
  });

  it('usa tuteo neutro en los textos clave del assessment', () => {
    const t = (k: string) =>
      k.split('.').reduce<unknown>(
        (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
        es.assessment,
      );
    expect(t('profile.focusTitle')).toBe('¿Tienes alguna meta particular?');
    expect(t('cardio.hint')).toBe('¿Quieres incluir cardio en tu programa?');
    expect(t('profile.days')).toContain('Elige cuántos días');
  });
});
