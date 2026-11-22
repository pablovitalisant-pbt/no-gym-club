import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlanData, PlanDay } from '../lib/types/plan';

const DICT: Record<string, string> = {
  calendar: 'Calendario',
  closeCalendar: 'Cerrar',
  calendarAria: 'Semana {week}, día {day}, {status}',
  statusDone: 'completado',
  statusCurrent: 'actual',
  statusRest: 'descanso',
  statusPending: 'pendiente',
  phaseHeader: 'FASE {n} · {name}',
  phaseFallback: 'FASE {n}',
  phaseNotGenerated: 'Se genera al terminar la fase anterior',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vals?: Record<string, unknown>) =>
    (DICT[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vals?.[k] ?? '')),
}));

import PlanCalendar from '../components/plan/PlanCalendar';
import { buildCalendar, parseDayParam } from '../lib/plan/calendar';

function makeDay(type: PlanDay['type']): PlanDay {
  return {
    type,
    label_es: type,
    label_en: type,
    session:
      type === 'rest'
        ? null
        : {
            title_es: type,
            title_en: type,
            warmup: [],
            main: [{ exercise: 'flexiones', sets: 3, reps: '8', rest_seconds: 60 }],
            cooldown: [],
            rationale_es: '',
            rationale_en: '',
            science_refs: [],
          },
  };
}

function makePlan(phaseCount: number): PlanData {
  return {
    version: 2,
    total_weeks: 12,
    phase_weeks: 4,
    phases: Array.from({ length: phaseCount }, (_, i) => ({
      index: i as 0 | 1 | 2,
      name_es: `fase ${i}`,
      name_en: `phase ${i}`,
      week_template: Array.from({ length: 7 }, (_, d) =>
        makeDay(d === 6 ? 'rest' : 'push'),
      ),
      rationale_es: '',
      rationale_en: '',
      science_refs: [],
      generated_at: '2026-01-01T00:00:00.000Z',
    })),
  };
}

describe('buildCalendar — 3 bloques de 28 días', () => {
  it('marca completados, actual, descanso y deshabilita fases no generadas', () => {
    const blocks = buildCalendar(makePlan(1), 3, [0, 1, 2], 'es');
    expect(blocks).toHaveLength(3);
    expect(blocks[0].generated).toBe(true);
    expect(blocks[0].cells).toHaveLength(28);
    expect(blocks[0].cells.slice(0, 3).every((c) => c.completed)).toBe(true);
    expect(blocks[0].cells[3].current).toBe(true);
    expect(blocks[0].cells[6].rest).toBe(true);
    expect(blocks[0].cells[3].disabled).toBe(false);

    for (const b of blocks.slice(1)) {
      expect(b.generated).toBe(false);
      expect(b.cells).toHaveLength(28);
      expect(b.cells.every((c) => c.disabled)).toBe(true);
    }
  });

  it('nombra la fase segun locale y deja null si no existe', () => {
    expect(buildCalendar(makePlan(1), 0, [], 'en')[0].name).toBe('phase 0');
    expect(buildCalendar(makePlan(1), 0, [], 'es')[1].name).toBeNull();
  });
});

describe('parseDayParam', () => {
  it('acepta 0-83 y descarta fuera de rango o basura', () => {
    expect(parseDayParam('0')).toBe(0);
    expect(parseDayParam('5')).toBe(5);
    expect(parseDayParam('83')).toBe(83);
    expect(parseDayParam('84')).toBeNull();
    expect(parseDayParam('-1')).toBeNull();
    expect(parseDayParam('abc')).toBeNull();
    expect(parseDayParam(undefined)).toBeNull();
  });
});

describe('PlanCalendar — aria y clases', () => {
  const html = renderToStaticMarkup(
    <PlanCalendar
      plan={makePlan(1)}
      viewedIdx={3}
      currentDayIndex={3}
      completedDayIndexes={[0, 1, 2]}
      locale="es"
      onSelect={() => {}}
      onClose={() => {}}
    />,
  );

  it('cada celda es un button con aria-label de semana, día y estado', () => {
    expect(html).toContain('aria-label="Semana 1, día 1, completado"');
    expect(html).toContain('aria-label="Semana 1, día 4, actual"');
    expect(html).toContain('aria-label="Semana 1, día 7, descanso"');
    const buttons = html.match(/<button/g) ?? [];
    // 84 celdas + botón cerrar
    expect(buttons.length).toBe(85);
  });

  it('completado relleno, actual borde grueso y visto con borde de acento', () => {
    expect(html).toContain('bg-primary text-on-primary');
    expect(html).toContain('border-2 border-primary');
    expect(html).toContain('border-accent');
  });

  it('las fases 2 y 3 quedan deshabilitadas y con su texto', () => {
    const disabled = html.match(/disabled=""/g) ?? [];
    expect(disabled.length).toBe(56);
    expect(html).toContain('Se genera al terminar la fase anterior');
    expect(html).toContain('FASE 2');
    expect(html).toContain('FASE 3');
  });
});
