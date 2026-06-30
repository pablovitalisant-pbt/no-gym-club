import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';

type ButtonBaseProps = {
  variant?: 'primary' | 'ghost';
};

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
  };

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: 'a';
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base = 'inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-none transition-colors focus:outline-none focus:ring-2 focus:ring-accent';

const variants: Record<string, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  ghost: 'border border-border text-text-primary hover:bg-surface-800',
};

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  const className = `${base} ${variants[variant]} ${props.className ?? ''}`;

  if (props.as === 'a') {
    // ponytail: type assertion — TS discriminated union no ve variant en el narrowed type
    const { variant: _, ...anchorProps } = props as ButtonAsLink & { variant?: string };
    return <a className={className} {...anchorProps} />;
  }

  const { variant: _, ...buttonProps } = props as ButtonAsButton & { variant?: string };
  return <button className={className} {...buttonProps} />;
}
