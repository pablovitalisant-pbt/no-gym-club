'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export const ROTATE_MS = 6000;

// Fisher-Yates: orden aleatorio sin repetir hasta agotar.
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function advanceIndex(index: number, length: number): number {
  return length > 0 ? (index + 1) % length : 0;
}

export function formatElapsed(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export default function GeneratingMessages() {
  const t = useTranslations('dashboard.plan.waiting');
  const messages = t.raw('messages') as string[];
  const [order] = useState(() => shuffle(messages));
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const rotate = setInterval(
      () => setIndex((i) => advanceIndex(i, order.length)),
      ROTATE_MS,
    );
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(rotate);
      clearInterval(clock);
    };
  }, [order.length]);

  return (
    <div className="space-y-sm">
      <div aria-live="polite">
        <p
          key={index}
          className="min-h-[4.5rem] font-headline-md text-headline-md text-on-surface animate-[fade-in_0.6s_ease-out] motion-reduce:animate-none motion-reduce:transition-none"
        >
          {order[index]}
        </p>
      </div>
      <div
        className="h-1 overflow-hidden bg-surface-700"
        role="progressbar"
        aria-label={t('progressLabel')}
      >
        <div className="h-full w-1/3 bg-primary animate-[progress-slide_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
      <p className="font-mono-data text-primary">{formatElapsed(elapsed)}</p>
      <p className="text-label-sm text-on-surface-variant">{t('hint')}</p>
    </div>
  );
}
