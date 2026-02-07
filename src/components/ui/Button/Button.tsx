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
      'focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && [
        'bg-accent-600 text-white',
        'hover:bg-accent-500',
        'focus:ring-accent-500',
      ],
      variant === 'secondary' && [
        'border border-neutral-600 bg-transparent text-neutral-300',
        'hover:border-neutral-400 hover:text-white',
        'focus:ring-neutral-500',
      ],
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
