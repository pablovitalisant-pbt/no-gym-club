import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { startCountdown } from '../lib/session/startCountdown';

const mk = (ms: number) => ({
  timerRef: { current: null as ReturnType<typeof setInterval> | null },
  endsAtRef: { current: Date.now() + ms as number | null },
});

describe('startCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('tick cada 1000ms con segundos restantes redondeados', () => {
    const { timerRef, endsAtRef } = mk(3000);
    const onTick = vi.fn();
    startCountdown(timerRef, endsAtRef, { onTick, onEnd: vi.fn() });
    vi.advanceTimersByTime(999);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenLastCalledWith(2);
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenLastCalledWith(1);
  });

  it('al llegar a 0 llama onTick(0), limpia timerRef y llama onEnd una vez', () => {
    const { timerRef, endsAtRef } = mk(2000);
    const onTick = vi.fn();
    const onEnd = vi.fn();
    startCountdown(timerRef, endsAtRef, { onTick, onEnd });
    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenLastCalledWith(0);
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(timerRef.current).toBeNull();
  });

  it('endsAtRef null cuenta como 0 y termina', () => {
    const { timerRef, endsAtRef } = mk(5000);
    endsAtRef.current = null;
    const onEnd = vi.fn();
    startCountdown(timerRef, endsAtRef, { onTick: vi.fn(), onEnd });
    vi.advanceTimersByTime(1000);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('reemplaza el intervalo previo', () => {
    const a = mk(10000);
    const onTickA = vi.fn();
    startCountdown(a.timerRef, a.endsAtRef, { onTick: onTickA, onEnd: vi.fn() });
    const onTickB = vi.fn();
    startCountdown(a.timerRef, a.endsAtRef, { onTick: onTickB, onEnd: vi.fn() });
    vi.advanceTimersByTime(1000);
    expect(onTickA).not.toHaveBeenCalled();
    expect(onTickB).toHaveBeenCalledTimes(1);
  });

  it('cancelar (clearInterval del ref, como al desmontar) detiene los ticks', () => {
    const { timerRef, endsAtRef } = mk(10000);
    const onTick = vi.fn();
    startCountdown(timerRef, endsAtRef, { onTick, onEnd: vi.fn() });
    clearInterval(timerRef.current!);
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('onEnd puede reiniciar la cuenta (lado 2)', () => {
    const { timerRef, endsAtRef } = mk(1000);
    const onTick2 = vi.fn();
    startCountdown(timerRef, endsAtRef, {
      onTick: vi.fn(),
      onEnd: () => {
        endsAtRef.current = Date.now() + 2000;
        startCountdown(timerRef, endsAtRef, { onTick: onTick2, onEnd: vi.fn() });
      },
    });
    vi.advanceTimersByTime(3000);
    expect(onTick2).toHaveBeenLastCalledWith(0);
    expect(timerRef.current).toBeNull();
  });
});

describe('session-runner usa startCountdown en vivo', () => {
  const src = readFileSync('app/[locale]/(session)/session/[id]/session-runner.tsx', 'utf8');
  it('importa y usa startCountdown para rest y timing', () => {
    expect(src).toContain("from '@/lib/session/startCountdown'");
    expect((src.match(/startCountdown\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
