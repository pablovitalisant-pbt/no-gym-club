import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  repsTargets,
  inputsFrom,
  buildRepEntries,
} from '../lib/session/continuous-view';
import { saveSnapshot } from '../lib/session/runner-persistence';
import type { SessionExercise } from '../lib/types/session';

const root = resolve(__dirname, '..');
const src = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const summary = src('components/session/ContinuousSummary.tsx');
const player = src('components/session/ContinuousPlayer.tsx');
const runner = src('app/[locale]/(session)/session/[id]/session-runner.tsx');
const persistence = src('lib/session/runner-persistence.ts');
const done = src('components/session/SessionDoneScreen.tsx');
const es = JSON.parse(src('messages/es.json'));
const en = JSON.parse(src('messages/en.json'));

// ─── 1. Flag de release ───
describe('v3-07 · flag session_done_screen encendido', () => {
  it('el release v3 activa la pantalla final', () => {
    const flags = JSON.parse(src('config/feature-flags.json'));
    expect(flags.session_done_screen).toBe(true);
  });
});

// ─── 2. Reps perdidas en silencio ───
describe('v3-07 · no se descartan errores al guardar reps', () => {
  it('el resumen espera el resultado y solo marca Guardado si tuvo éxito', () => {
    expect(summary).toMatch(/await saveExerciseReps\(/);
    expect(summary).toMatch(/if\s*\(!res(?:ult)?\.success\)/);
    expect(summary).toContain('summarySaveError');
    expect(summary).not.toMatch(/saveExerciseReps\([^)]*\)\.catch\(\(\) => \{\}\)/);
  });

  it('un fallo muestra error legible y conserva lo escrito para reintentar', () => {
    expect(summary).toMatch(/setSaveError|setError/);
    expect(summary).toContain('text-base');
    expect(summary).toContain('summarySave');
  });

  it('el reproductor del corrido no guarda fire-and-forget', () => {
    expect(player).not.toContain('saveExerciseReps');
    expect(player).not.toMatch(/\.catch\(\(\) => \{\}\)/);
  });

  it('el runner de paso a paso no oculta el resultado', () => {
    expect(runner).not.toMatch(/saveExerciseReps\([^)]*\)\.catch\(\(\) => \{\}\)/);
    expect(runner).toMatch(/saveExerciseReps[\s\S]{0,400}success/);
  });
});

// ─── 3. Doble guardado: el resumen tiene la última palabra ───
describe('v3-07 · una sola vía de guardado en el corrido', () => {
  it('las reps registradas prellenan y las editadas son las que se guardan', () => {
    const exercises: SessionExercise[] = [
      { exercise: 'Sentadillas', sets: 2, reps: '10' },
      { exercise: 'Plancha', duration_seconds: 30 },
    ];
    const targets = repsTargets(exercises);
    const prefilled = inputsFrom(targets, { '0:1': '12', '0:2': '13' });
    expect(prefilled[0]).toEqual(['12', '13']);

    // El usuario edita en el resumen: la vía final guarda lo editado.
    prefilled[0][1] = '9';
    const entries = buildRepEntries(targets, prefilled);
    expect(entries).toHaveLength(1);
    expect(entries[0].actualReps).toEqual(['12', '9']);
  });

  it('inputsFrom exportado desde la vista (lógica pura)', () => {
    expect(typeof inputsFrom).toBe('function');
  });
});

// ─── 4. localStorage sin try/catch ───
describe('v3-07 · runner-persistence degrada en silencio', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete (globalThis as Record<string, unknown>).localStorage;
  });

  it('saveSnapshot no lanza si localStorage falla', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        setItem() {
          throw new Error('quota exceeded');
        },
      },
    });
    expect(() =>
      saveSnapshot({
        sessionId: 's1',
        state: 'active',
        index: 0,
        restEndsAt: null,
        timingEndsAt: null,
        restInfo: { exerciseIndex: 0, exercise: 'x', prescribedRest: 0 },
        restTimes: [],
        exerciseLog: [],
        updatedAt: Date.now(),
      }),
    ).not.toThrow();
  });

  it('el guardado está envuelto en try/catch', () => {
    expect(persistence).toMatch(/function saveWithPrefix[\s\S]{0,300}try\s*\{/);
  });
});

// ─── 5. Snapshot solo se limpia si el guardado tuvo éxito ───
describe('v3-07 · clearSnapshot condicionado al guardado', () => {
  it('no limpia el snapshot antes de saber el resultado', () => {
    expect(runner).toMatch(/saveSessionTimes[\s\S]{0,400}success[\s\S]{0,200}clearSnapshot/);
    expect(runner).not.toMatch(/saveSessionTimes\([\s\S]{0,300}?\);\s*clearSnapshot\(sessionId\);/);
  });
});

// ─── 6. Calendario real del dashboard ───
describe('v3-07 · Ver calendario abre el día en el dashboard', () => {
  it('usa el parámetro day real', () => {
    expect(done).toContain('?day=');
    expect(done).toContain('planDayIndex');
  });

  it('sin día de plan no muestra el botón secundario', () => {
    expect(done).toMatch(/planDayIndex != null/);
    expect(done).toContain('viewCalendar');
  });
});

// ─── 7. i18n simétrico, sin keys huérfanas ───
describe('v3-07 · keys i18n', () => {
  it('saveReps y omit ya no existen en ningún idioma', () => {
    expect(es.session).not.toHaveProperty('saveReps');
    expect(en.session).not.toHaveProperty('saveReps');
    expect(es.session).not.toHaveProperty('omit');
    expect(en.session).not.toHaveProperty('omit');
  });

  it('summarySaveError existe en ambos idiomas', () => {
    expect(es.session?.summarySaveError).toBeTruthy();
    expect(en.session?.summarySaveError).toBeTruthy();
  });

  it('claves de session simétricas', () => {
    expect(Object.keys(es.session).sort()).toEqual(Object.keys(en.session).sort());
  });
});
