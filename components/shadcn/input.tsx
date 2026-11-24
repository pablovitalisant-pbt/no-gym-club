import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full min-h-[56px] bg-surface-900 brutalist-border brutalist-input pl-xl pr-sm py-md text-on-surface font-mono-data uppercase placeholder:text-on-surface-variant/30 transition-all duration-200',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
