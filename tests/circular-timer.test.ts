import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const compPath = resolve(root, 'components/session/CircularTimer.tsx');

describe('CircularTimer — SVG semigauge presentacional', () => {
  if (!existsSync(compPath)) {
    it('CircularTimer.tsx no existe todavía (Fase B — falla por diseño)', () => {
      expect(existsSync(compPath)).toBe(true);
    });
    return;
  }
  const comp = readFileSync(compPath, 'utf-8');

  // ─── 1: Componente exporta props ───
  it('CircularTimer.tsx exporta interface con remaining, total, size?', () => {
    expect(comp).toContain('remaining');
    expect(comp).toContain('total');
    expect(comp).toContain('size');
  });

  // ─── 2: Progress clampeado a [0, 1] ───
  it('progress se clampea con Math.min / Math.max para evitar NaN y fuera de rango', () => {
    // Debe tener Math.min(1, ...) o Math.max(0, ...) alrededor de remaining/total
    const hasClamp = comp.includes('Math.min(1,') && comp.includes('Math.max(0,');
    expect(hasClamp).toBe(true);
  });

  // ─── 3: Guard contra división por cero ───
  it('guarda contra total <= 0 para evitar división por cero', () => {
    // Debe verificar total > 0 antes de dividir, o tener valor default
    expect(comp).toContain('total');
    // Buscar un guard tipo 'total > 0' o 'total ?' antes de la división
    const hasGuard = comp.includes('total > 0') || comp.includes('total ?') || comp.includes('total ||');
    expect(hasGuard).toBe(true);
  });

  // ─── 4: Color via currentColor + Tailwind ───
  it('usa currentColor + clase Tailwind para color del arco (no hex/vars)', () => {
    // El arco de progreso debe tener stroke="currentColor" o className con color Tailwind
    expect(comp).toContain('currentColor');
    // Debe usar una clase de color Tailwind (text-*)
    expect(comp).toContain('className=');
    // No debe tener colores hex hardcodeados para el progreso
    // (el fondo puede tener un color, pero el progreso no)
    const progressArc = comp.indexOf('stroke-dasharray');
    const beforeProgress = comp.slice(0, progressArc);
    // El color debe venir de className, no de stroke="#xxxxxx"
    expect(comp).not.toMatch(/stroke="[^"]*#[0-9a-fA-F]+"/);
  });

  // ─── 5: Transición suave ───
  it('tiene transition para stroke-dashoffset', () => {
    expect(comp).toContain('transition');
    expect(comp).toContain('stroke-dashoffset');
  });

  // ─── 6: SVG viewBox y elementos ruta ───
  it('contiene SVG con viewBox y al menos un path/circle', () => {
    expect(comp).toContain('viewBox');
    expect(comp).toContain('<svg');
    expect(comp).toContain('path');
  });
});
