import { cn } from '@/utils/cn';

type AvatarProps = {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
} as const;

export const Avatar = ({ src, alt, size = 'md', className }: AvatarProps) => (
  <img
    src={src}
    alt={alt}
    className={cn(
      'rounded-full object-cover ring-2 ring-neutral-700',
      sizeClasses[size],
      className,
    )}
  />
);
