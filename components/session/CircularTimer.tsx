'use client';

interface CircularTimerProps {
  remaining: number;
  total: number;
  size?: number;
}

export default function CircularTimer({
  remaining,
  total,
  size = 200,
}: CircularTimerProps) {
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.min(1, Math.max(0, 1 - remaining / safeTotal));

  const cx = size * 0.5;
  const cy = size * 0.48;
  const r = size * 0.44;
  const circumference = Math.PI * r;
  const dashoffset = circumference * (1 - progress);

  const arcPath = `M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`;

  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox={`0 0 ${size} ${size * 0.5}`}
      className="block mx-auto"
    >
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
        stroke="currentColor"
        className="text-primary-container"
        strokeWidth={size * 0.04}
        strokeLinecap="round"
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: dashoffset,
          transition: 'stroke-dashoffset 1s linear',
        }}
      />
    </svg>
  );
}
