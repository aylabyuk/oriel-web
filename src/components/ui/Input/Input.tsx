import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-neutral-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5',
            'text-white placeholder:text-neutral-500',
            'transition-colors outline-none',
            'focus:border-red-500 focus:ring-1 focus:ring-red-500',
            error && 'border-red-400',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
