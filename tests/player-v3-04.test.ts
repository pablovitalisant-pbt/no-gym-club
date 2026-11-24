import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  buildTimeline,
  start,
  tick,
  advance,
  recordReps,
  setMode,
  extend,
} from '../lib/session/continuous';
import { repsKeyForSegment } from '../lib/session/continuous-view';
import { alarmForFrame } from '../lib/session/player-sound';
import { loadRunMode, saveRunMode } from '../lib/session/run-mode';
import type { SessionExercise } from '../lib/types/session';

const root = resolve(__dirname, '..');
const src = (p: string) => readFileSync(resolve(root, p), 'utf-8');

// ─── Contraste WCAG de los tokens de controles y descanso ───
function tokens(css: string, selector: string): Record<string, [number, number, number]> {
  const start = css.indexOf(selector);
  expect(start, `falta el bloque ${selector}`).toBeGreaterThanOrEqual(0);
  const block = css.slice(start, css.indexOf('}', start));
  const out: Record<string, [number, number, number]> = {};
  for (const m of block.matchAll(/--c-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('v3-04 · tokens de controles con contraste 4.5:1 en ambos temas', () => {
  const css = src('app/globals.css');
  const themes = {
    dark: tokens(css, ':root,\n  :root[data-theme="dark"]'),
    light: tokens(css, ':root[data-theme="light"]'),
  };

  for (const [name, t] of Object.entries(themes)) {
    it(`${name}: control-bg vs background y surface-900`, () => {
      expect(t['control-bg'], 'falta --c-control-bg').toBeDefined();
      for (const bg of ['background', 'surface-900'] as const) {
        expect(contrast(t['control-bg'], t[bg]), `control-bg vs ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${name}: control-fg vs control-bg`, () => {
      expect(t['control-fg'], 'falta --c-control-fg').toBeDefined();
      expect(contrast(t['control-fg'], t['control-bg'])).toBeGreaterThanOrEqual(4.5);
    });

    it(`${name}: rest-fg vs rest-bg`, () => {
      expect(t['rest-bg'], 'falta --c-rest-bg').toBeDefined();
      expect(t['rest-fg'], 'falta --c-rest-fg').toBeDefined();
      expect(contrast(t['rest-fg'], t['rest-bg'])).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('tailwind expone rest-bg/rest-fg y control-bg/control-fg', () => {
    const tw = src('tailwind.config.ts');
    expect(tw).toContain('--c-rest-bg');
    expect(tw).toContain('--c-rest-fg');
    expect(tw).toContain('--c-control-bg');
    expect(tw).toContain('--c-control-fg');
  });
});

// ─── Preferencia auto/manual persistida ───
function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('v3-04 · modo auto/manual persistido', () => {
  it('sin preferencia cae en auto', () => {
    expect(loadRunMode(memoryStorage())).toBe('auto');
  });

  it('guarda manual en ngc-run-mode y lo restaura', () => {
    const storage = memoryStorage();
    saveRunMode('manual', storage);
    expect(storage.data['ngc-run-mode']).toBe('manual');
    expect(loadRunMode(storage)).toBe('manual');
  });

  it('valor corrupto cae en auto', () => {
    expect(loadRunMode(memoryStorage({ 'ngc-run-mode': 'otro' }))).toBe('auto');
  });
});

// ─── Reglas de sonido sin doble pitido ───
describe('v3-04 · alarmForFrame', () => {
  const frame = (over: Partial<Parameters<typeof alarmForFrame>[1]>) => ({
    index: 1,
    remaining: 5,
    running: true,
    waiting: false,
    done: false,
    ...over,
  });

  it('sin audio no suena nada', () => {
    expect(alarmForFrame(frame({ remaining: 4 }), frame({ remaining: 3 }), false)).toBe('none');
  });

  it('cambio de segmento suena transición, aunque venga de remaining 1', () => {
    expect(alarmForFrame(frame({ remaining: 1 }), frame({ index: 2, remaining: 30 }), true)).toBe(
      'transition',
    );
  });

  it('cuenta 3-2-1 solo en marcha y sin espera', () => {
    expect(alarmForFrame(frame({ remaining: 3 }), frame({ remaining: 2 }), true)).toBe('tick');
    expect(alarmForFrame(frame({ remaining: 2 }), frame({ remaining: 1 }), true)).toBe('tick');
    expect(alarmForFrame(frame({ remaining: 4 }), frame({ remaining: 3 }), true)).toBe('tick');
  });

  it('pausado o esperando no hace tick', () => {
    expect(
      alarmForFrame(frame({ remaining: 3, running: false }), frame({ remaining: 2, running: false }), true),
    ).toBe('none');
    expect(
      alarmForFrame(frame({ remaining: 0, waiting: true }), frame({ remaining: 0, waiting: true }), true),
    ).toBe('none');
  });

  it('remaining igual no repite tick', () => {
    expect(alarmForFrame(frame({ remaining: 2 }), frame({ remaining: 2 }), true)).toBe('none');
  });

  it('fin de sesión suena done', () => {
    expect(
      alarmForFrame(frame({ remaining: 1 }), frame({ index: 9, remaining: 0, done: true }), true),
    ).toBe('done');
  });

  it('primer frame no suena', () => {
    expect(alarmForFrame(null, frame({ remaining: 3 }), true)).toBe('none');
  });
});

// ─── Motor: reps, avance y descanso manual ───
describe('v3-04 · motor de corrido', () => {
  const exercises: SessionExercise[] = [
    { exercise: 'Sentadillas', sets: 2, reps: '10-12', rest_seconds: 30 },
  ];
  const timeline = buildTimeline(exercises);

  it('un segmento de reps espera al usuario', () => {
    const s = advance({ ...start(0), index: 0 }, timeline, 0);
    expect(tick(s, timeline, 999999)).toMatchObject({ waiting: true, index: 1 });
  });

  it('advance registra reps y pasa al descanso', () => {
    const s = advance(start(0), timeline, 0); // → reps set 1
    const withReps = recordReps(s, '0:1', '12');
    expect(withReps.reps['0:1']).toBe('12');
    const rest = advance(withReps, timeline, 1000);
    expect(timeline[rest.index].kind).toBe('rest');
    expect(rest.reps['0:1']).toBe('12');
  });

  it('en manual el descanso espera a 0 y sigue con advance', () => {
    const restIdx = timeline.findIndex((seg) => seg.kind === 'rest');
    const s = { ...start(0, 'manual'), index: restIdx, remaining: 30, updatedAt: 0 };
    expect(tick(s, timeline, 30000)).toMatchObject({ waiting: true, remaining: 0 });
    const next = advance(s, timeline, 30000);
    expect(next.index).toBe(restIdx + 1);
  });

  it('setMode cambia en medio de la sesión', () => {
    const s = setMode(start(0), 'manual', 1000);
    expect(s.mode).toBe('manual');
    expect(s.remaining).toBe(9);
  });

  it('extend suma segundos al descanso', () => {
    expect(extend(start(0), 15, 0).remaining).toBe(25);
    const waiting = { ...start(0, 'manual'), index: 2, remaining: 0 };
    expect(tick(extend(waiting, 15, 0), timeline, 0).remaining).toBe(15);
  });

  it('clave de reps por segmento: bilateral usa left/right', () => {
    expect(repsKeyForSegment({ exerciseIndex: 3, set: 2 })).toBe('3:2');
    expect(repsKeyForSegment({ exerciseIndex: 3, set: 2, side: 'left' })).toBe('3:4');
    expect(repsKeyForSegment({ exerciseIndex: 3, set: 2, side: 'right' })).toBe('3:5');
  });
});

// ─── Hook con la API nueva ───
describe('v3-04 · hook expone modo, espera y reps', () => {
  const hook = src('lib/session/useContinuousPlayer.ts');
  for (const member of ['mode', 'waiting', 'setMode', 'advance', 'recordReps', 'reps', 'extendRest']) {
    it(`expone ${member}`, () => {
      expect(hook).toContain(member);
    });
  }

  it('restaura el modo desde ngc-run-mode y lo escribe en el snapshot', () => {
    expect(hook).toContain('loadRunMode');
    expect(hook).toContain('saveRunMode');
    expect(src('lib/session/run-mode.ts')).toContain('ngc-run-mode');
  });

  it('audio nuevo: tick, transición, done y stopAll', () => {
    expect(hook).toContain('playAlarm');
    expect(hook).toContain('stopAll');
    expect(hook).not.toContain('playBeep');
    const sound = src('lib/session/player-sound.ts');
    for (const fn of ['playTick', 'playTransition', 'playDone', 'stopAll']) {
      expect(sound).toContain(fn);
    }
  });
});

// ─── Componentes del reproductor ───
describe('v3-04 · subcomponentes del reproductor', () => {
  const dir = 'components/session/player';

  it('existen los subcomponentes del contrato', () => {
    for (const file of [
      'WorkScreen.tsx',
      'RepsScreen.tsx',
      'RestScreen.tsx',
      'ReadyScreen.tsx',
      'PlayerControls.tsx',
      'ModeToggle.tsx',
    ]) {
      expect(existsSync(resolve(root, dir, file)), `falta ${file}`).toBe(true);
    }
  });

  it('ContinuousPlayer delega y ya no usa los controles surface-800', () => {
    const player = src('components/session/ContinuousPlayer.tsx');
    for (const c of ['WorkScreen', 'RepsScreen', 'RestScreen', 'PlayerControls', 'ModeToggle']) {
      expect(player).toContain(c);
    }
    expect(player).not.toContain('bg-surface-800');
  });

  it('controles de 64px, modo de 44px y textos >=16px', () => {
    const controls = src(`${dir}/PlayerControls.tsx`);
    expect(controls).toMatch(/min-h-\[64px\]|h-16/);
    expect(controls).toContain('bg-control-bg');
    expect(controls).toContain('text-control-fg');
    expect(controls).not.toMatch(/\btext-(xs|sm)\b/);
    const toggle = src(`${dir}/ModeToggle.tsx`);
    expect(toggle).toMatch(/min-h-\[44px\]|h-11/);
    const reps = src(`${dir}/RepsScreen.tsx`);
    expect(reps).toMatch(/min-h-\[64px\]|h-16/);
    expect(reps).toMatch(/\btype="number"|inputMode="numeric"/);
    expect(reps).not.toMatch(/\btext-(xs|sm)\b/);
  });

  it('descanso a pantalla completa: título, countdown >=120px y acciones', () => {
    const rest = src(`${dir}/RestScreen.tsx`);
    expect(rest).toContain('restTitle');
    expect(rest).toContain('bg-rest-bg');
    expect(rest).toContain('text-rest-fg');
    expect(rest).toContain('addSeconds');
    expect(rest).toContain('skipRest');
    const sizes = [...rest.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]));
    expect(Math.max(...sizes), 'countdown >= 120px').toBeGreaterThanOrEqual(120);
  });

  it('título y objetivo de reps son grandes', () => {
    const work = src(`${dir}/WorkScreen.tsx`);
    expect(work).toMatch(/text-headline-lg|text-3xl|text-\[(\d+)px\]/);
    expect(work).toContain('continue');
  });
});

// ─── i18n simétrica, sin voseo ───
describe('v3-04 · claves i18n nuevas simétricas ES/EN', () => {
  const es = JSON.parse(src('messages/es.json'));
  const en = JSON.parse(src('messages/en.json'));
  const keys = [
    'modeAuto',
    'modeManual',
    'restTitle',
    'nextUp',
    'repsDone',
    'repsLabel',
    'addSeconds',
    'continue',
    'objective',
  ];

  for (const key of keys) {
    it(`session.${key} en ambos idiomas`, () => {
      expect(es.session?.[key], `falta es.session.${key}`).toBeTruthy();
      expect(en.session?.[key], `falta en.session.${key}`).toBeTruthy();
    });
  }

  it('no usa voseo ni el viejo playBeep', () => {
    for (const value of Object.values(es.session) as string[]) {
      if (typeof value === 'string') {
        expect(value).not.toMatch(/\b(tenés|podés|hacé|elegí|mirá|debés|sentate)\b/i);
      }
    }
    expect(existsSync(resolve(root, 'lib/audio.ts'))).toBe(true);
    expect(src('lib/audio.ts')).not.toContain('playBeep');
  });
});

// ─── session-runner migró al audio nuevo ───
describe('v3-04 · session-runner usa el audio nuevo', () => {
  const runner = src('app/[locale]/(session)/session/[id]/session-runner.tsx');

  it('importa tick/transición/done y ya no playBeep', () => {
    expect(runner).not.toContain('playBeep');
    expect(runner).toContain('playTick');
    expect(runner).toContain('playTransition');
    expect(runner).toContain('playDone');
  });
});
