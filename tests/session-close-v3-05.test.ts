import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  resolveSessionEntry,
  snapshotForEntry,
  sessionOutcome,
} from '../lib/session/entry';
import type { SessionData } from '../lib/types/session';
import type { RunnerSnapshot, ContinuousRunnerSnapshot } from '../lib/session/runner-persistence';

const root = resolve(__dirname, '..');
const src = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const session: SessionData = {
  title_es: 'Sesión',
  title_en: 'Session',
  rationale_es: '',
  rationale_en: '',
  science_refs: [],
  warmup: [{ exercise: 'Movilidad', sets: 2, reps: '10', rest_seconds: 30 }],
  main: [
    { exercise: 'Sentadillas', sets: 3, reps: '12-15', rest_seconds: 60 },
    { exercise: 'Plancha', duration_seconds: 30 },
  ],
  cooldown: [{ exercise: 'Estiramiento', duration_seconds: 60 }],
};

// ─── Decisión de pantalla al montar el runner ───
describe('v3-05 · resolveSessionEntry', () => {
  const openRow = { completed_at: null, rpe: null };

  it('sesión ya guardada en DB va a done, aunque haya snapshot', () => {
    expect(
      resolveSessionEntry(
        { completed_at: '2026-11-24T10:00:00Z', rpe: null },
        { stage: 'summary' },
      ),
    ).toBe('done');
    expect(
      resolveSessionEntry({ completed_at: null, rpe: 7 }, { stage: 'rpe' }),
    ).toBe('done');
  });

  it('sin snapshot queda en idle', () => {
    expect(resolveSessionEntry(openRow, null)).toBe('idle');
  });

  it('snapshot de reps ya guardadas va al resumen', () => {
    expect(resolveSessionEntry(openRow, { stage: 'summary' })).toBe('summary');
  });

  it('snapshot esperando RPE va al formulario', () => {
    expect(resolveSessionEntry(openRow, { stage: 'rpe' })).toBe('rpe');
  });

  it('corrido sin terminar retoma continuous', () => {
    expect(resolveSessionEntry(openRow, { continuousDone: false })).toBe('continuous');
  });

  it('corrido terminado sin snapshot de resumen va al resumen', () => {
    expect(resolveSessionEntry(openRow, { continuousDone: true })).toBe('summary');
  });
});

describe('v3-05 · snapshotForEntry', () => {
  const runner = { stage: 'summary', recordedReps: { '1:1': '12' } } as unknown as RunnerSnapshot;
  const continuous = { state: { reps: {} } } as unknown as ContinuousRunnerSnapshot;

  it('prioriza la etapa del runner', () => {
    expect(snapshotForEntry(runner, continuous)).toEqual({ stage: 'summary' });
    expect(snapshotForEntry({ ...runner, stage: 'rpe' }, null)).toEqual({ stage: 'rpe' });
  });

  it('usa el corrido cuando no hay etapa guardada', () => {
    expect(snapshotForEntry(null, continuous)).toEqual({ continuousDone: false });
    expect(snapshotForEntry(null, null)).toBeNull();
  });
});

// ─── Resumen del día para la pantalla final ───
describe('v3-05 · sessionOutcome', () => {
  it('cuenta ejercicios, minutos, RPE y día del plan', () => {
    const out = sessionOutcome(session, 7, 4);
    expect(out.exerciseCount).toBe(4);
    expect(out.exerciseNames).toEqual(['Movilidad', 'Sentadillas', 'Plancha', 'Estiramiento']);
    expect(out.minutes).toBeGreaterThanOrEqual(1);
    expect(out.rpe).toBe(7);
    expect(out.dayNumber).toBe(5);
    expect(out.totalDays).toBe(84);
  });

  it('sin plan no inventa número de día', () => {
    const out = sessionOutcome(session, null, null);
    expect(out.dayNumber).toBeNull();
    expect(out.rpe).toBeNull();
  });
});

// ─── Contraste WCAG >=7:1 de los tokens usados ───
function luminance(rgb: [number, number, number]): number {
  const lin = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function themeTokens(block: string): (name: string) => [number, number, number] {
  return (name) => {
    const m = block.match(new RegExp(`--c-${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+);`));
    if (!m) throw new Error(`token --c-${name} no encontrado`);
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
}

describe('v3-05 · contraste de tokens (>=7:1 en claro y oscuro)', () => {
  const css = src('app/globals.css');
  const lightIdx = css.indexOf(':root[data-theme="light"]');
  const dark = themeTokens(css.slice(0, lightIdx));
  const light = themeTokens(css.slice(lightIdx));

  const pairs: Array<[string, string]> = [
    ['on-surface', 'background'],
    ['on-surface', 'card'],
    ['on-surface', 'surface-900'],
    ['control-fg', 'control-bg'],
    ['text-primary', 'background'],
  ];

  for (const [fg, bg] of pairs) {
    it(`${fg} sobre ${bg} ≥ 7:1 en ambos temas`, () => {
      expect(ratio(dark(fg), dark(bg)), `oscuro ${fg}/${bg}`).toBeGreaterThanOrEqual(7);
      expect(ratio(light(fg), light(bg)), `claro ${fg}/${bg}`).toBeGreaterThanOrEqual(7);
    });
  }
});

// ─── i18n simétrico, español neutro ───
describe('v3-05 · textos ES/EN simétricos', () => {
  const es = JSON.parse(src('messages/es.json'));
  const en = JSON.parse(src('messages/en.json'));
  const keys = [
    'summaryTitle',
    'summaryGreeting',
    'summarySave',
    'summarySaved',
    'doneTitle',
    'doneExerciseCount',
    'doneMinutes',
    'doneRpeLabel',
    'doneDay',
    'backToPanel',
    'viewCalendar',
  ];

  for (const key of keys) {
    it(`session.${key} existe en ambos idiomas`, () => {
      expect(es.session?.[key], `falta es.session.${key}`).toBeTruthy();
      expect(en.session?.[key], `falta en.session.${key}`).toBeTruthy();
    });
  }

  it('sin voseo en los textos nuevos', () => {
    for (const key of keys) {
      expect(String(es.session[key])).not.toMatch(/\b(tenés|podés|hacé|elegí|mirá|debés|sentate)\b/i);
    }
  });
});

// ─── Resumen de reps: tarjetas tipo calistenia, sin stepper ───
describe('v3-05 · ContinuousSummary visual', () => {
  const summary = src('components/session/ContinuousSummary.tsx');

  it('título grande, sin verde, con quiebre de línea', () => {
    expect(summary).toContain('text-3xl');
    expect(summary).toContain('break-words');
    expect(summary).not.toContain('text-green-500');
  });

  it('cajas de serie grandes y etiquetas S1..', () => {
    expect(summary).toContain('min-w-[64px]');
    expect(summary).toContain('min-h-[56px]');
    expect(summary).toContain('text-[22px]');
    expect(summary).toContain('S{');
    expect(summary).not.toContain('w-20');
    expect(summary).not.toContain('brutalist-border');
  });

  it('prellena con las reps registradas por el runner', () => {
    expect(summary).toContain('recorded');
  });

  it('botón principal Guardar registro con feedback y sin omitir', () => {
    expect(summary).toContain('summarySave');
    expect(summary).toContain('summarySaved');
    expect(summary).toContain('setTimeout');
    expect(summary).not.toContain('omit');
  });
});

// ─── RPE: rejilla 5x2 grande, tokens de tema ───
describe('v3-05 · LogForm RPE', () => {
  const form = src('components/session/LogForm.tsx');

  it('rejilla 5x2 con botones de 56px y número grande', () => {
    expect(form).toContain('grid-cols-5');
    expect(form).toContain('min-h-[56px]');
    expect(form).toContain('text-xl');
    expect(form).not.toContain('w-9');
  });

  it('descripción siempre visible bajo la rejilla', () => {
    expect(form).toContain('aria-live');
  });

  it('textos >=16px y tokens de tema', () => {
    expect(form).not.toContain('text-xs');
    expect(form).toContain('text-on-surface');
    expect(form).toContain('control-bg');
    expect(form).not.toContain('bg-green-');
  });

  it('entrega el RPE elegido al guardar', () => {
    expect(form).toContain('onSaved(rpe)');
  });
});

// ─── Pantalla final nueva ───
describe('v3-05 · SessionDoneScreen', () => {
  const path = 'components/session/SessionDoneScreen.tsx';

  it('existe con check grande y acciones primaria/secundaria', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
    const screen = src(path);
    expect(screen).toContain('CheckCircle');
    expect(screen).toContain('doneTitle');
    expect(screen).toContain('backToPanel');
    expect(screen).toContain('viewCalendar');
    expect(screen).toContain('min-h-[56px]');
    expect(screen).toContain('text-lg');
  });
});

// ─── Runner: montaje, salida y persistencia de etapas ───
describe('v3-05 · session-runner', () => {
  const runner = src('app/[locale]/(session)/session/[id]/session-runner.tsx');

  it('decide la pantalla con resolveSessionEntry', () => {
    expect(runner).toContain('resolveSessionEntry');
    expect(runner).toContain('snapshotForEntry');
  });

  it('guarda las reps registradas antes del resumen', () => {
    expect(runner).toContain('recordedReps');
    expect(runner).toContain("stage: 'summary'");
    expect(runner).toContain("stage: 'rpe'");
  });

  it('muestra SessionDoneScreen al guardar el RPE', () => {
    expect(runner).toContain('SessionDoneScreen');
    expect(runner).toContain('savedRpe');
  });

  it('idle permite volver e indica el modo auto/manual', () => {
    expect(runner).toContain('BackButton');
    expect(runner).toContain('ModeToggle');
  });
});

describe('v3-05 · page de sesión lee la DB', () => {
  const page = src('app/[locale]/(session)/session/[id]/page.tsx');

  it('consulta completed_at, rpe y plan_day_index', () => {
    expect(page).toContain('completed_at');
    expect(page).toContain('rpe');
    expect(page).toContain('plan_day_index');
  });

  it('renderiza SessionDoneScreen para sesiones guardadas', () => {
    expect(page).toContain('SessionDoneScreen');
  });

  it('el flag nuevo existe y se consume', () => {
    const flags = JSON.parse(src('config/feature-flags.json'));
    expect(flags.session_done_screen).toBe(true);
    expect(page).toContain("getFlag('session_done_screen')");
  });
});

// ─── log_data: una sola vía de escritura ───
describe('v3-05 · mergeLogData sigue siendo la única vía', () => {
  it('el único UPDATE de log_data está dentro de mergeLogData', () => {
    const actions = src('app/[locale]/(session)/session/[id]/actions.ts');
    const updates = actions.match(/\.update\(\s*\{\s*log_data/g) || [];
    expect(updates.length).toBe(1);
    expect(actions).toContain('mergeLogData');
  });
});
