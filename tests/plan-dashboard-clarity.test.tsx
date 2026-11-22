import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PlanDayView } from '../lib/plan/day-view';
import type { SessionData } from '../lib/types/session';

const DICT: Record<string, string> = {
  weekDay: 'Semana {week} · Día {day}',
  previousDay: 'Día anterior',
  nextDay: 'Día siguiente',
  currentDay: 'Día actual',
  markCurrentDay: 'Marcar como día actual',
  completeDay: 'Completar día',
  completing: 'Guardando...',
  completedDay: 'Día completado',
  completeWithoutLog: 'Marcar como hecho sin registrar',
  startSessionComingSoon: 'Empezar sesión',
  startTraining: 'Empezar entrenamiento',
  goToCurrentDay: 'Ir al día actual',
  todayTitle: 'Entrenamiento de hoy',
  todayRestTitle: 'Hoy descansas',
  markRestDone: 'Marcar descanso como hecho',
  restDay: 'Día de descanso',
  restBody: 'Recupera, camina y estira.',
  estimatedMinutes: '~{minutes} min',
  exerciseCount: '{count} ejercicios',
  sectionSummary: '{count} ejercicios · ~{minutes} min',
  warmup: 'Calentamiento',
  main: 'Parte principal',
  finisher: 'Finisher',
  cardio: 'Cardio',
  cooldown: 'Vuelta a la calma',
  'dayTypes.push': 'Empuje',
  'dayTypes.pull': 'Tracción',
  'dayTypes.legs': 'Piernas',
  'dayTypes.upper': 'Tren superior',
  'dayTypes.lower': 'Tren inferior',
  'dayTypes.full': 'Cuerpo completo',
  'dayTypes.skill': 'Habilidad',
  'dayTypes.cardio': 'Cardio',
  'dayTypes.metabolic': 'Metabólico',
  'dayTypes.mobility': 'Movilidad',
  'dayTypes.rest': 'Descanso',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vals?: Record<string, unknown>) =>
    (DICT[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vals?.[k] ?? '')),
}));

import DayView from '../components/plan/DayView';
import { estimateSessionMinutes } from '../lib/plan/session-summary';

const session: SessionData = {
  title_es: 'Empuje',
  title_en: 'Push',
  warmup: [{ exercise: 'Jumping jacks', duration_seconds: 30, sets: 1 }],
  main: [{ exercise: 'Flexiones', sets: 2, reps: '10', rest_seconds: 60 }],
  cooldown: [],
  rationale_es: '',
  rationale_en: '',
  science_refs: [],
};

function view(overrides: Partial<PlanDayView> = {}): PlanDayView {
  return {
    week: 1,
    dayNumber: 1,
    phaseIndex: 0,
    phaseName: 'Fase 1',
    day: { type: 'push', label_es: 'Empuje', label_en: 'Push', session },
    isRest: false,
    ...overrides,
  };
}

const mediaIndex = {
  'jumping jacks': { slug: 'jumping-jacks', gif_url: null, image_url: 'https://x/jj.gif' },
  flexiones: { slug: 'push-up', gif_url: 'https://x/pushup.gif', image_url: null },
};

function render(props: Partial<Parameters<typeof DayView>[0]> = {}) {
  return renderToStaticMarkup(
    <DayView
      view={view()}
      idx={0}
      currentDayIndex={0}
      completedDayIndexes={[]}
      locale="es"
      mediaIndex={mediaIndex}
      todayCard
      onPrev={() => {}}
      onNext={() => {}}
      onComplete={() => {}}
      onSetCurrent={() => {}}
      onGoToCurrent={() => {}}
      onStart={() => {}}
      completing={false}
      {...props}
    />,
  );
}

describe('Slice v2-15 — dashboard claro: qué hacer', () => {
  it('el CTA primario aparece antes de la lista y dispara la sesión', () => {
    const html = render();
    expect(html).toContain('Empezar entrenamiento');
    expect(html.indexOf('Empezar entrenamiento')).toBeLessThan(html.indexOf('Calentamiento'));
    const src = readFileSync(resolve(__dirname, '../components/plan/TodayCard.tsx'), 'utf-8');
    expect(src).toMatch(/onClick=\{onStart\}/);
  });

  it('duración estimada calculada con buildTimeline y redondeada a minutos', () => {
    // ready 10 + jacks 30 + flexiones 30 + rest 60 + flexiones 30 = 160 s → 3 min
    expect(estimateSessionMinutes(session)).toBe(3);
    expect(render()).toContain('~3 min');
    expect(render()).toContain('2 ejercicios');
  });

  it('badges de tipo de día traducidos ES/EN', () => {
    const es = JSON.parse(readFileSync(resolve(__dirname, '../messages/es.json'), 'utf-8'));
    const en = JSON.parse(readFileSync(resolve(__dirname, '../messages/en.json'), 'utf-8'));
    const types = ['push', 'pull', 'legs', 'upper', 'lower', 'full', 'skill', 'cardio', 'metabolic', 'mobility', 'rest'];
    expect(Object.keys(es.dashboard.plan.dayTypes).sort()).toEqual([...types].sort());
    expect(Object.keys(en.dashboard.plan.dayTypes).sort()).toEqual([...types].sort());
    expect(render()).toContain('Empuje');
    expect(render()).not.toContain('>push<');
  });

  it('secciones plegadas por defecto con resumen N ejercicios · ~M min', () => {
    const html = render();
    expect(html).toContain('<details');
    expect(html).not.toContain('<details open');
    expect(html).toContain('1 ejercicios · ~1 min');
  });

  it('si el día visto no es el actual, el CTA invita a ir al día actual', () => {
    const html = render({ idx: 3, currentDayIndex: 0 });
    expect(html).toContain('Ir al día actual');
    expect(html).not.toContain('Empezar entrenamiento');
  });

  it('día de descanso: tarjeta con "Hoy descansas" y botón para marcarlo', () => {
    const html = render({
      view: view({ day: { type: 'rest', label_es: 'Descanso', label_en: 'Rest', session: null }, isRest: true }),
    });
    expect(html).toContain('Hoy descansas');
    expect(html).toContain('Marcar descanso como hecho');
  });
});
