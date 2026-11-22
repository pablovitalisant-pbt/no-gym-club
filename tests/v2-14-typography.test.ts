import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const src = readFileSync(resolve(root, 'tailwind.config.ts'), 'utf-8');

function size(token: string): string | null {
  const m = src.match(new RegExp(`'${token}': \\['(\\d+px)'`));
  return m ? m[1] : null;
}

describe('Slice v2-14 — tamaños de letra legibles', () => {
  it.each([
    ['label-sm', '15px'],
    ['label-bold', '16px'],
    ['mono-data', '16px'],
    ['body-md', '18px'],
    ['body-lg', '20px'],
  ])('%s mide %s', (token, expected) => {
    expect(size(token)).toBe(expected);
  });

  it('mantiene headline-lg-mobile', () => {
    expect(size('headline-lg-mobile')).toBe('28px');
  });
});
