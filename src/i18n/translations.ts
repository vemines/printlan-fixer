import vi from './locales/vi.json';
import en from './locales/en.json';

export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';

export type TranslationSchema = typeof vi;

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  vi,
  en,
};
