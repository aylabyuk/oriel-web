import { cn } from '@/utils/cn';
import { SOCIAL_LINKS, EMAIL_ICON_PATH, buildEmailUrl } from '@/constants/social';

type SocialLinksProps = {
  compact?: boolean;
};

const emailLink = {
  label: 'Email',
  url: buildEmailUrl(),
  iconPath: EMAIL_ICON_PATH,
};

const links = [...SOCIAL_LINKS, emailLink];

export const SocialLinks = ({ compact }: SocialLinksProps) => {
  const size = compact ? 18 : 22;

  return (
    <div className={cn('flex items-center justify-center', compact ? 'gap-4' : 'gap-5')}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={cn(
            'text-neutral-400 transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:text-neutral-600 dark:text-white/35 dark:hover:text-white/70',
            compact ? 'p-0.5' : 'p-1',
          )}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={link.iconPath} />
          </svg>
        </a>
      ))}
    </div>
  );
};
