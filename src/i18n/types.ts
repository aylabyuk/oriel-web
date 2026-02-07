import type { en } from '@/i18n/en';

/** The full translations object shape */
export type Translations = typeof en;

/** Supported locale codes */
export type Locale = 'en';

/**
 * Recursively builds dot-separated key paths from a nested object.
 * e.g. { welcome: { title: 'x' } } → 'welcome.title'
 */
export type TranslationKey<T = Translations, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? TranslationKey<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

/**
 * Extracts interpolation parameter names from a translation string.
 * e.g. '{{name}} at {{company}}' → 'name' | 'company'
 */
export type InterpolationParams<S extends string> =
  S extends `${string}{{${infer Param}}}${infer Rest}`
    ? Param | InterpolationParams<Rest>
    : never;

/**
 * Resolves the value type for a dot-path key against the translations object.
 */
export type TranslationValue<
  K extends string,
  T = Translations,
> = K extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? TranslationValue<Tail, T[Head]>
    : never
  : K extends keyof T
    ? T[K]
    : never;

/**
 * The arguments required for a given translation key.
 * Keys with {{param}} placeholders require a params object; others take no args.
 */
export type TranslationArgs<K extends TranslationKey> =
  InterpolationParams<TranslationValue<K> & string> extends never
    ? []
    : [params: Record<InterpolationParams<TranslationValue<K> & string>, string | number>];
