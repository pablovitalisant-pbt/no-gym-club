'use client';
import { useId } from 'react';

interface CircularTimerProps {
  remaining: number;
  total: number;
  size?: number;
}

export default function CircularTimer({
  remaining,
  total,
  size = 320,
}: CircularTimerProps) {
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.min(1, Math.max(0, 1 - remaining / safeTotal));

  const gradientId = useId();
  const filterId = useId();

  const viewH = size * 0.62;
  const cx = size * 0.5;
  const cy = viewH * 0.9;
  const r = size * 0.47;
  const circumference = Math.PI * r;
  const dashoffset = circumference * (1 - progress);

  const arcPath = `M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`;

  return (
    <svg
      width={size}
      height={viewH}
      viewBox={`0 0 ${size} ${viewH}`}
      className="block mx-auto"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#e8570a" />
          <stop offset="100%" stopColor="#ff4444" />
        </linearGradient>
        <filter id={filterId}>
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#e8570a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Background arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="currentColor"
        className="text-surface-800"
        strokeWidth={size * 0.04}
        strokeLinecap="round"
      />

      {/* Progress arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={size * 0.04}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: dashoffset,
          transition: 'stroke-dashoffset 1s linear',
        }}
      />
    </svg>
  );
}
