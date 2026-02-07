import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button = ({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'rounded-lg px-6 py-2.5 font-semibold transition-colors',
      'focus:ring-2 focus:ring-offset-2 focus:outline-none',
      'focus:ring-offset-neutral-50 dark:focus:ring-offset-black',
      'disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && [
        'bg-red-600 text-white',
        'hover:bg-red-500',
        'focus:ring-red-500',
      ],
      variant === 'secondary' && [
        'border border-neutral-300 bg-transparent text-neutral-600',
        'hover:border-neutral-400 hover:text-neutral-900',
        'focus:ring-neutral-500',
        'dark:border-neutral-600 dark:text-neutral-300',
        'dark:hover:border-neutral-400 dark:hover:text-white',
      ],
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
