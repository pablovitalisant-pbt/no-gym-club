import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');

describe('entorno QA', () => {
  it('declara la excepcion y el comando local', () => {
    const qa = JSON.parse(readFileSync(resolve(root, '.pbravot/qa-entorno.json'), 'utf8'));
    expect(qa.url).toBe('http://localhost:3123');
    expect(qa.comando).toContain('3123');
    expect(qa.env.QA_EXCEPCION_PRODUCCION).toBe('pablo-2026-11-21');
    expect(qa.guardas).toEqual([]);
  });

  it('preparador usa Admin API, limpia por user_id y no imprime contraseñas', () => {
    const raw = readFileSync(resolve(root, '.pbravot/qa-preparar.mjs'), 'utf8');
    expect(raw).toContain('auth.admin');
    expect(raw).toContain('user_id');
    expect(raw).toContain('cuentas.json');
    expect(raw).toContain('email_confirm: true');
    expect(raw).not.toMatch(/console\.log\([^\n]*password/i);
  });

  it('incluye las tres cuentas sintéticas y el barrido', () => {
    const raw = readFileSync(resolve(root, '.pbravot/qa-preparar.mjs'), 'utf8');
    const sweep = readFileSync(resolve(root, '.pbravot/qa-barrido.md'), 'utf8');
    for (const email of ['qa.extremo@nogym.test', 'qa.intermedio@nogym.test', 'qa.nuevo@nogym.test']) {
      expect(raw).toContain(email);
    }
    for (const route of ['landing', 'login', 'dashboard', 'assessment', 'exercises', 'progress', 'weekly-report']) {
      expect(sweep).toContain(route);
    }
  });
});
