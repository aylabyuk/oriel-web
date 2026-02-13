export type SocialLink = {
  label: string;
  url: string;
  /** SVG path `d` attribute (24x24 viewBox, stroke-based) */
  iconPath: string;
};

/** Feather-style mail icon path */
export const EMAIL_ICON_PATH =
  'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2-8 5-8-5';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/oriel-vinci-absin/',
    // Feather-style LinkedIn icon
    iconPath:
      'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    label: 'GitHub',
    url: 'https://github.com/aylabyuk',
    // Feather-style GitHub icon
    iconPath:
      'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
  },
  {
    label: 'HackerRank',
    url: 'https://www.hackerrank.com/profile/oriel_absin',
    // Simplified HackerRank logo path
    iconPath:
      'M12 2L3 7v10l9 5 9-5V7l-9-5zm-1 14h-1v-4H8l3-4v4h1l-3 4zm5-2h-1l-3 4v-4h-1l3-4v4h2v4z',
  },
];

/** Build a mailto URL — subject only, body left empty for the visitor to write freely. */
export const buildEmailUrl = (): string => {
  const subject = 'Hey Oriel — visited your UNO portfolio!';
  return `mailto:oriel.absin@gmail.com?subject=${encodeURIComponent(subject)}`;
};
