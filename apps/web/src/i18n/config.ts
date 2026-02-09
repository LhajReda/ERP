export const locales = ['fr', 'ar', 'dar'] as const;
export type Locale = (typeof locales)[number];
export const rtlLocales: Locale[] = ['ar'];
export const defaultLocale: Locale = 'fr';
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ar: 'العربية',
  dar: 'Darija',
};
