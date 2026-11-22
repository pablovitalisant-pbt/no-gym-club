import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
} from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
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

// min-h-[56px]: target táctil accesible en móvil (slice v2-14)
const base = 'inline-flex items-center justify-center px-6 py-3 min-h-[56px] text-base font-semibold rounded-none transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<string, string> = {
  primary: 'bg-accent text-surface-900 hover:bg-accent/90',
  secondary: 'border-2 border-text-primary text-text-primary hover:bg-surface-800',
  ghost: 'border border-border text-text-primary hover:bg-surface-800',
};

export function Button({ variant = 'primary', iconLeft: IconLeft, iconRight: IconRight, ...props }: ButtonProps) {
  const className = `${base} ${variants[variant]} ${props.className ?? ''}`;

  const content = (
    <>
      {IconLeft && <IconLeft size={20} className="mr-2" />}
      {props.children}
      {IconRight && <IconRight size={20} className="ml-2" />}
    </>
  );

  if (props.as === 'a') {
    // ponytail: type assertion — TS discriminated union no ve variant en el narrowed type
    const { variant: _, iconLeft: __, iconRight: ___, children, ...anchorProps } = props as ButtonAsLink & { variant?: string; iconLeft?: LucideIcon; iconRight?: LucideIcon };
    return <a className={className} {...anchorProps}>{content}</a>;
  }

  const { variant: _, iconLeft: __, iconRight: ___, children, ...buttonProps } = props as ButtonAsButton & { variant?: string; iconLeft?: LucideIcon; iconRight?: LucideIcon };
  return <button className={className} {...buttonProps}>{content}</button>;
}
