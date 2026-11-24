import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = HTMLAttributes<HTMLDivElement> & { value: number; max?: number };

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-2 w-full overflow-hidden bg-outline', className)}
      {...props}
    >
      <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
