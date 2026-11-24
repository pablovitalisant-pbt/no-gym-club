import { playDone, playTick, playTransition, stopAll } from '@/lib/audio';

export type AlarmKind = 'none' | 'tick' | 'transition' | 'done';

export interface SoundFrame {
  index: number;
  remaining: number;
  running: boolean;
  waiting: boolean;
  done: boolean;
}

/**
 * Decide la alarma de un frame. Un cambio de segmento siempre suena transición
 * (nunca transición + tick del mismo frame); el 3-2-1 solo corre en marcha.
 */
export function alarmForFrame(
  prev: SoundFrame | null,
  cur: SoundFrame,
  enabled: boolean,
): AlarmKind {
  if (!enabled || !prev) return 'none';
  if (cur.done && !prev.done) return 'done';
  if (cur.index !== prev.index) return 'transition';
  if (!cur.running || cur.waiting) return 'none';
  if (cur.remaining >= 1 && cur.remaining <= 3 && cur.remaining !== prev.remaining) return 'tick';
  return 'none';
}

export function playAlarm(kind: AlarmKind): void {
  if (kind === 'tick') playTick();
  else if (kind === 'transition') playTransition();
  else if (kind === 'done') playDone();
}

export { stopAll };
