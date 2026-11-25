import type { MutableRefObject } from 'react';

interface AdvanceDeps {
  saveSnap: (state: string, index: number, over?: { restEndsAt?: null; timingEndsAt?: null }) => void;
  setState: (s: never) => void;
  setIndex: (fn: (i: number) => number) => void;
  playDone: () => void;
  playTransition: () => void;
  audioRef: MutableRefObject<boolean>;
  total: number;
}

// Sin hooks de React adentro: se recrea en cada render y es testeable sin DOM.
export function useRunnerAdvance(d: AdvanceDeps) {
  const set = d.setState as (s: string) => void;
  /** Avance con snapshot 'active' (handleDone / handleConfirmReps / handleSkipRest). */
  const advance = (index: number) => {
    d.saveSnap('active', index + 1, { restEndsAt: null, timingEndsAt: null });
    set('active');
    d.setIndex((i) => i + 1);
  };
  /** Cierre de ejercicio al restaurar: sonido, y 'done' si es el último o 'active' con index+1 (sin snapshot). */
  const finishExercise = (index: number) => {
    if (d.audioRef.current) {
      if (index >= d.total - 1) d.playDone();
      else d.playTransition();
    }
    if (index >= d.total - 1) set('done');
    else {
      set('active');
      d.setIndex((i) => i + 1);
    }
  };
  return { advance, finishExercise };
}
