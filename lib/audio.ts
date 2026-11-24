// ponytail: Web Audio API — zero dependencies, works in all modern browsers
// Gestor unico: un AudioContext, lista de osciladores activos y anti-solape por prioridad.

export type ToneKind = 'tick' | 'transition' | 'done';
export type Pulse = { freq: number; start: number; duration: number };
export type OverlapDecision = 'play' | 'skip';

export const TICK_HZ = 880;
export const TICK_MS = 80;
export const TRANSITION_HZ = [1000, 1300] as const;
export const TRANSITION_PULSE_MS = 150;
export const TRANSITION_GAP_MS = 50; // total 0.35 s <= 0.5 s
export const DONE_HZ = [800, 1000, 1300] as const;
export const DONE_PULSE_MS = 150;
export const DONE_GAP_MS = 100; // total 0.65 s <= 1 s
export const PRIORITY_GAP_MS = 250;
export const STOP_RAMP_MS = 10;
export const VOLUME = 0.5;

const TONES: Record<ToneKind, { hz: readonly number[]; pulseMs: number; gapMs: number }> = {
  tick: { hz: [TICK_HZ], pulseMs: TICK_MS, gapMs: 0 },
  transition: { hz: TRANSITION_HZ, pulseMs: TRANSITION_PULSE_MS, gapMs: TRANSITION_GAP_MS },
  done: { hz: DONE_HZ, pulseMs: DONE_PULSE_MS, gapMs: DONE_GAP_MS },
};
/** Planifica los pulsos sin tocar Web Audio (testeable). */
export function planTone(kind: ToneKind, now: number): Pulse[] {
  const t = TONES[kind];
  return t.hz.map((freq, i) => ({
    freq,
    start: now + (i * (t.pulseMs + t.gapMs)) / 1000,
    duration: t.pulseMs / 1000,
  }));
}
/** Prioridad anti-solape: transition/done cortan; tick se descarta sobre transicion. */
export function resolveOverlap(
  prev: ToneKind | null,
  next: ToneKind,
  gapMs: number,
): OverlapDecision {
  if (gapMs >= PRIORITY_GAP_MS || prev === null) return 'play';
  if (next === 'tick' && prev !== 'tick') return 'skip';
  return 'play';
}
let ctx: AudioContext | null = null;
const active: { osc: OscillatorNode; gain: GainNode }[] = [];
let lastKind: ToneKind | null = null;
let lastAt = -Infinity;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}
/** Corta los osciladores vigentes con rampa corta de gain. */
export function stopAll(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const { osc, gain } of active.splice(0)) {
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + STOP_RAMP_MS / 1000);
      osc.stop(t + STOP_RAMP_MS / 1000);
    } catch {
      // ya detenido o contexto cerrado
    }
  }
}

function play(kind: ToneKind): void {
  try {
    const audioCtx = getCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const gapMs = (now - lastAt) * 1000;
    if (resolveOverlap(lastKind, kind, gapMs) === 'skip') return;

    stopAll();
    lastAt = now;
    lastKind = kind;

    for (const p of planTone(kind, now)) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(p.freq, p.start);
      gain.gain.setValueAtTime(VOLUME, p.start);
      gain.gain.exponentialRampToValueAtTime(0.001, p.start + p.duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.onended = () => {
        const i = active.findIndex((a) => a.osc === osc);
        if (i >= 0) active.splice(i, 1);
      };
      active.push({ osc, gain });
      osc.start(p.start);
      osc.stop(p.start + p.duration);
    }
  } catch {
    // Audio no disponible — silencio
  }
}

/** 3-2-1: pulso corto. */
export function playTick(): void {
  play('tick');
}

/** Cambio de segmento: dos pulsos. */
export function playTransition(): void {
  play('transition');
}

/** Fin de sesion: tres pulsos ascendentes. */
export function playDone(): void {
  play('done');
}

/** Alias legacy (llamadores existentes) — mismo comportamiento que transition. */
export const playBeep = playTransition;
