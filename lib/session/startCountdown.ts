import type { MutableRefObject } from 'react';

interface CountdownHandlers {
  onTick: (remaining: number) => void;
  /** Se llama tras limpiar el intervalo cuando remaining llega a 0. */
  onEnd: () => void;
}

/** Cuenta atrás por endsAt (1s). Dueña de timerRef: limpia el intervalo previo y el propio al terminar. */
export function startCountdown(
  timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
  endsAtRef: MutableRefObject<number | null>,
  { onTick, onEnd }: CountdownHandlers,
) {
  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    const remaining = endsAtRef.current
      ? Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000))
      : 0;
    onTick(remaining);
    if (remaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      onEnd();
    }
  }, 1000);
}
