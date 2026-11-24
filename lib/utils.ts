import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge no conoce los fontSize custom del tema y los tomaba por color de
// texto: `cn('text-surface-900', 'text-body-lg')` borraba el color (v2-26, Bug #12).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display-lg',
        'text-headline-lg',
        'text-headline-lg-mobile',
        'text-headline-md',
        'text-body-lg',
        'text-body-md',
        'text-label-bold',
        'text-mono-data',
        'text-label-sm',
      ],
    },
  },
});

// Base de shadcn/ui: mezcla clases y resuelve conflictos de Tailwind.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
