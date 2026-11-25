'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export const NOTCH_COUNT = 30;

export function gaugeGeometry(size: number, numberSize = 112) {
  const stroke = 10;
  const radius = size * 0.39;
  const cx = size / 2;
  const cy = radius + stroke;
  const numberTop = cy - radius * 0.55;
  return { width: size, height: Math.max(cy + stroke / 2, numberTop + numberSize * 0.9), cx, cy, radius, numberTop };
}

export function notchState(progress: number, index: number, count: number) {
  const safe = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const ratio = count > 1 ? index / (count - 1) : 0;
  return { lit: index < Math.round(safe * count), color: ratio < 0.5 ? 'success' : ratio < 0.8 ? 'primary' : 'error' } as const;
}

interface Props { progress: number; children?: ReactNode; size?: number; numberSize?: number }

export default function NotchGauge({ progress, children, size = 320, numberSize = 112 }: Props) {
  const t = useTranslations('session');
  const { width, height, cx, cy, radius, numberTop } = gaugeGeometry(size, numberSize);
  return (
    <div className="relative flex items-center justify-center" style={{ width, height, aspectRatio: `${width} / ${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('gaugeLabel')} className="absolute inset-0 h-full w-full">
        {Array.from({ length: NOTCH_COUNT }, (_, i) => {
          const angle = Math.PI + (Math.PI * i) / (NOTCH_COUNT - 1);
          const x1 = cx + Math.cos(angle) * (radius - 8);
          const y1 = cy + Math.sin(angle) * (radius - 8);
          const x2 = cx + Math.cos(angle) * radius;
          const y2 = cy + Math.sin(angle) * radius;
          const state = notchState(progress, i, NOTCH_COUNT);
          const stroke = state.lit ? `rgb(var(--c-${state.color}))` : 'rgb(var(--c-border))';
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="10" strokeLinecap="round" />;
        })}
      </svg>
      <div className="absolute z-10 font-display-lg leading-none tabular-nums" style={{ top: numberTop, fontSize: numberSize }} aria-live="polite">{children}</div>
    </div>
  );
}
