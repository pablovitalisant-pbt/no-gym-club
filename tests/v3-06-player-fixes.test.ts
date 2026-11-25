import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createTranslator } from 'next-intl';
import { buildTimeline } from '../lib/session/continuous';
import { segmentView } from '../lib/session/continuous-view';
import { greetingText } from '../lib/settings/greeting';
import type { SessionExercise } from '../lib/types/session';

const root = resolve(__dirname, '..');
const src = (p: string) => readFileSync(resolve(root, p), 'utf8');

// Reps con 2 series + ejercicio por tiempo (sets indefinido) + otro de reps con 2 series.
const exercises: SessionExercise[] = [
  { exercise: 'Sentadillas', sets: 2, reps: '10', rest_seconds: 30 },
  { exercise: 'Plancha', duration_seconds: 45, rest_seconds: 15 },
  { exercise: 'Flexiones', sets: 2, reps: '8', rest_seconds: 30 },
];
const timeline = buildTimeline(exercises);
const restIndex = (exIdx: number, set: number) =>
  timeline.findIndex((s) => s.kind === 'rest' && s.exerciseIndex === exIdx && s.set === set);

// ─── QA-02: el descanso anuncia la serie SIGUIENTE ───
describe('v3-06 QA-02 · descanso muestra la próxima serie, no la hecha', () => {
  it('descanso entre series: set+1 del mismo ejercicio', () => {
    const v = segmentView(timeline, exercises, restIndex(0, 1), 30)!;
    expect(v.phase).toBe('rest');
    expect(v.nextLabel).toBe('Sentadillas');
    expect(v.nextSet).toBe(2);
    expect(v.nextSets).toBe(2);
    expect(v.nextShowSet).toBe(true);
  });

  it('descanso entre ejercicios: serie 1 del ejercicio siguiente', () => {
    const v = segmentView(timeline, exercises, restIndex(0, 2), 30)!;
    expect(v.nextLabel).toBe('Plancha');
    expect(v.nextSet).toBe(1);
    expect(v.nextSets).toBe(0);
    expect(v.nextShowSet).toBe(false); // por tiempo: no "Serie 1 de 0"
  });

  it('sin segmento siguiente no rompe', () => {
    const v = segmentView(timeline, exercises, timeline.length - 1, 5)!;
    expect(v.nextSet).toBeNull();
    expect(v.nextShowSet).toBe(false);
  });
});

// ─── EXP-1: nada de "Serie X de 0" ───
describe('v3-06 EXP-1 · sin "Serie X de Y" cuando no aplica', () => {
  it('ejercicio por tiempo no muestra serie aunque falte sets', () => {
    const idx = timeline.findIndex((s) => s.kind === 'work');
    expect(segmentView(timeline, exercises, idx, 45)!.showSet).toBe(false);
  });

  it('sets <= 1 no muestra serie', () => {
    const one: SessionExercise[] = [{ exercise: 'Remo', sets: 1, reps: '12', rest_seconds: 10 }];
    const tl = buildTimeline(one);
    const repsIdx = tl.findIndex((s) => s.kind === 'reps');
    expect(segmentView(tl, one, repsIdx, 0)!.showSet).toBe(false);
  });

  it('reps con más de una serie sí muestra "Serie X de Y"', () => {
    const idx = timeline.findIndex((s) => s.kind === 'reps' && s.exerciseIndex === 0);
    expect(segmentView(timeline, exercises, idx, 0)!.showSet).toBe(true);
  });

  it('RestScreen y WorkScreen/RepsScreen condicionan la línea de serie', () => {
    const rest = src('components/session/player/RestScreen.tsx');
    expect(rest).toMatch(/showSet/);
    const work = src('components/session/player/WorkScreen.tsx');
    expect(work).toMatch(/showSet/);
    const reps = src('components/session/player/RepsScreen.tsx');
    expect(reps).toMatch(/showSet/);
  });
});

// ─── QA-04: controles que caben a 320 px ───
describe('v3-06 QA-04 · PlayerControls en dos filas sin desbordar', () => {
  const controls = src('components/session/player/PlayerControls.tsx');

  it('fila 1 (pausa) ancho completo y fila 2 con dos columnas iguales', () => {
    expect(controls).toContain('flex-col');
    expect(controls).toContain('w-full');
    expect((controls.match(/flex-1/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(controls).toContain('min-w-0');
  });

  it('texto >=16px, alto >=64px y sin paddings fijos que desborden', () => {
    expect(controls).toContain('text-base');
    expect((controls.match(/min-h-\[64px\]/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(controls).not.toContain('px-4');
    expect(controls).not.toMatch(/\bw-\[\d+px\]/);
  });
});

// ─── EXP-2: "Saltar" no debe tragarse una serie de reps ───
describe('v3-06 EXP-2 · saltar oculto mientras se esperan reps', () => {
  it('PlayerControls permite ocultar el botón y el player lo hace en reps', () => {
    const controls = src('components/session/player/PlayerControls.tsx');
    expect(controls).toContain('canSkip');
    const player = src('components/session/ContinuousPlayer.tsx');
    expect(player).toMatch(/canSkip=\{info\.phase !== 'reps'\}/);
  });
});

// ─── EXP-3: IntlError FORMATTING_ERROR al leer el saludo con {name} ───
describe('v3-06 EXP-3 · saludo sin t() interpolado', () => {
  const es = JSON.parse(src('messages/es.json'));

  it('t() sin {name} reproduce el FORMATTING_ERROR; t.raw no', () => {
    const errors: unknown[] = [];
    const t = createTranslator({
      locale: 'es',
      messages: es,
      onError: (error) => errors.push(error),
    });
    t('session.summaryGreeting');
    expect(errors.length).toBeGreaterThan(0);
    expect(t.raw('session.summaryGreeting')).toBe('¡Buen trabajo, {name}!');
  });

  it('greetingText reemplaza el nombre sin lanzar', () => {
    const template = createTranslator({ locale: 'es', messages: es }).raw(
      'session.summaryGreeting',
    );
    expect(greetingText(template as string, 'Pablo')).toBe('¡Buen trabajo, Pablo!');
    expect(greetingText(template as string, null)).toBeNull();
  });

  it('los tres saludos usan t.raw', () => {
    expect(src('components/session/ContinuousSummary.tsx')).toContain(
      "t.raw('summaryGreeting')",
    );
    expect(
      src('components/session/runner/RunnerDoneScreen.tsx'),
    ).toContain("t.raw('completeGreeting')");
    expect(src('app/[locale]/(app)/dashboard/page.tsx')).toContain("t.raw('greeting')");
  });
});
