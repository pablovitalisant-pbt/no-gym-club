import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  startOptions,
  segmentView,
  repsTargets,
  initialRepInputs,
  buildRepEntries,
} from '../lib/session/continuous-view';
import { buildTimeline } from '../lib/session/continuous';
import type { SessionExercise } from '../lib/types/session';

const exercises: SessionExercise[] = [
  { exercise: 'Sentadillas', sets: 2, reps: '10-12', rest_seconds: 30 },
  { exercise: 'Plancha', duration_seconds: 45, sets: 1, rest_seconds: 15 },
  { exercise: 'Zancadas', sets: 1, reps: '8', bilateral: true, rest_seconds: 20 },
];
const timeline = buildTimeline(exercises);

describe('CO-1 flag OFF no ofrece el modo de corrido', () => {
  it('solo paso a paso con el flag apagado', () => {
    expect(startOptions(false)).toEqual(['step']);
  });

  it('con el flag encendido ofrece corrido y paso a paso', () => {
    expect(startOptions(true)).toEqual(['continuous', 'step']);
  });
});

describe('CO-2 segmento actual y siguiente desde el motor', () => {
  it('ready inicial', () => {
    expect(segmentView(timeline, exercises, 0, 10)).toMatchObject({
      phase: 'ready',
      exerciseName: 'Sentadillas',
      set: 0,
      nextLabel: 'Sentadillas',
    });
  });

  it('work con serie y total de series', () => {
    const v = segmentView(timeline, exercises, 3, 20);
    expect(v).toMatchObject({
      phase: 'reps',
      exerciseName: 'Sentadillas',
      set: 2,
      sets: 2,
    });
    expect(v!.progress).toBeGreaterThan(0);
    expect(v!.progress).toBeLessThan(1);
  });

  it('rest muestra el próximo ejercicio', () => {
    expect(segmentView(timeline, exercises, 4, 30)).toMatchObject({
      phase: 'rest',
      nextLabel: 'Plancha',
    });
  });

  it('bilateral expone el lado', () => {
    const idx = timeline.findIndex((s) => s.side === 'right');
    expect(segmentView(timeline, exercises, idx, 10)).toMatchObject({
      phase: 'reps',
      exerciseName: 'Zancadas',
      side: 'right',
    });
  });

  it('fuera de rango devuelve null', () => {
    expect(segmentView(timeline, exercises, timeline.length, 0)).toBeNull();
  });
});

describe('CO-3 registro final envía la lista completa', () => {
  it('prellena cada set con el objetivo y arma todas las entradas', () => {
    const targets = repsTargets(exercises);
    expect(targets.map((t) => [t.exercise, t.slots])).toEqual([
      ['Sentadillas', 2],
      ['Zancadas', 2],
    ]);
    const inputs = initialRepInputs(targets);
    expect(inputs[0]).toEqual(['10-12', '10-12']);
    inputs[0] = ['12', '10'];
    inputs[2] = ['9', '8'];
    expect(buildRepEntries(targets, inputs)).toEqual([
      {
        exercise: 'Sentadillas',
        prescribedSets: 2,
        prescribedReps: '10-12',
        actualReps: ['12', '10'],
        bilateral: false,
      },
      {
        exercise: 'Zancadas',
        prescribedSets: 1,
        prescribedReps: '8',
        actualReps: ['9', '8'],
        bilateral: true,
      },
    ]);
  });
});

describe('CO-4 Stop sin window.confirm', () => {
  const src = readFileSync(
    resolve(__dirname, '../components/session/ContinuousPlayer.tsx'),
    'utf8',
  );

  it('no usa window.confirm', () => {
    expect(src).not.toContain('window.confirm');
  });

  it('pide confirmación dentro de la UI', () => {
    expect(src).toContain('confirmStop');
  });
});
