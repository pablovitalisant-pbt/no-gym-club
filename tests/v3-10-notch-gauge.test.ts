import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import es from '../messages/es.json';
import en from '../messages/en.json';
import { gaugeGeometry, notchState } from '@/components/session/NotchGauge';

const root = resolve(__dirname, '..');
const player = (f: string) => readFileSync(resolve(root, 'components/session/player', f), 'utf-8');
const session = (f: string) => readFileSync(resolve(root, 'components/session', f), 'utf-8');
const idle = readFileSync(
  resolve(root, 'components/session/runner/IdleScreen.tsx'),
  'utf-8',
);
const runner = readFileSync(
  resolve(root, 'app/[locale]/(session)/session/[id]/session-runner.tsx'),
  'utf-8',
);

describe('v3-10 — NotchGauge (velocímetro de muescas)', () => {
  it('existe y es SVG puro sin librerías de gráficos', () => {
    expect(existsSync(resolve(root, 'components/session/NotchGauge.tsx'))).toBe(true);
    const s = session('NotchGauge.tsx');
    expect(s).not.toMatch(/recharts|chart\.js|victory|nivo|from ['"]d3/);
    expect(s).toMatch(/<svg/);
    expect(s).toContain('strokeLinecap="round"');
    expect(s).toContain('role="img"');
    expect(s).toContain('gaugeLabel');
    expect(s).toMatch(/NOTCH_COUNT\s*=\s*30/);
    expect(s).toContain('notchState');
  });

  it('notchState: apagadas en 0, mitad en 0.5, todas en 1, clamp y NaN', () => {
    const n = 30;
    const litCount = (p: number) =>
      Array.from({ length: n }, (_, i) => notchState(p, i, n).lit).filter(Boolean).length;

    expect(litCount(0)).toBe(0);
    expect(litCount(0.5)).toBe(15);
    expect(notchState(0.5, 14, n).lit).toBe(true);
    expect(notchState(0.5, 15, n).lit).toBe(false);
    expect(litCount(1)).toBe(30);
    expect(litCount(-1)).toBe(0);
    expect(litCount(NaN)).toBe(0);
    expect(litCount(2)).toBe(30);
  });

  it('notchState: color por posición verde → naranja → rojo', () => {
    const n = 30;
    expect(notchState(1, 0, n).color).toBe('success');
    expect(notchState(1, 15, n).color).toBe('primary');
    expect(notchState(1, 29, n).color).toBe('error');
  });

  it('WorkScreen y RestScreen usan NotchGauge; la barra lineal desaparece', () => {
    const work = player('WorkScreen.tsx');
    expect(work).toContain('NotchGauge');
    expect(work).not.toMatch(/bg-primary-container[^\n]*width:/);
    const rest = player('RestScreen.tsx');
    expect(rest).toContain('NotchGauge');
    expect(rest).toContain('total');
  });

  it('la geometría contiene el centro del arco y el avance de Work es del segmento', () => {
    const work = player('WorkScreen.tsx');
    const geometry = gaugeGeometry(320);
    expect(geometry.cy).toBeLessThanOrEqual(geometry.height);
    expect(geometry.cy + 5).toBeLessThanOrEqual(geometry.height);
    expect(work).toContain('1 - remaining / total');
    expect(work).not.toContain('info.progress');
  });

  it('IdleScreen ya no importa ModeToggle; el reproductor lo conserva una vez', () => {
    expect(idle).not.toContain('ModeToggle');
    expect(idle).not.toContain('idleMode');
    expect(runner).not.toContain('idleMode');
    const cp = session('ContinuousPlayer.tsx');
    expect(cp.match(/<ModeToggle/g)).toHaveLength(1);
  });

  it('i18n simétrico: gaugeLabel en es y en', () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' ? [`${k}.${keys(v as object)}`] : [k],
      );
    expect(keys(en.session).sort()).toEqual(keys(es.session).sort());
    expect(typeof es.session.gaugeLabel).toBe('string');
    expect(typeof en.session.gaugeLabel).toBe('string');
  });
});

describe('v3-10 — serie protagonista y input de reps listo para escribir', () => {
  it('WorkScreen y RepsScreen suben "Serie X de Y" a >=28px', () => {
    for (const f of ['WorkScreen.tsx', 'RepsScreen.tsx']) {
      const s = player(f);
      expect(s).toContain("t('setOf'");
      expect(s).toContain('font-label-bold text-[32px] text-on-surface');
    }
  });

  it('RestScreen resalta la serie siguiente (>=20px, negrita)', () => {
    const s = player('RestScreen.tsx');
    expect(s).toContain("t('setOf'");
    expect(s).toContain('font-bold');
    expect(s).toContain('text-[22px]');
  });

  it('input de reps: selecciona todo al enfocar/tocar y no usa autoFocus', () => {
    const s = player('RepsScreen.tsx');
    expect(s).not.toContain('autoFocus');
    expect(s).toContain('onFocus');
    expect(s).toContain('onClick');
    expect(s).toContain('select()');
    expect(s).toContain('setTimeout');
  });
});
