import { Language, TRANSLATIONS } from './translations';
import { PrinterError, UtilityItem } from '../types/printer';

export interface TranslatedItem {
  title: string;
  desc: string;
  rootCause?: string;
  fixSteps?: string[];
  riskNote?: string;
}

export interface UtilityMeta {
  title: string;
  desc: string;
  actionType: 'open' | 'manage' | 'fix';
  actionLabel: { vi: string; en: string } | string;
  stepTitles?: string[];
}

// Backward-compatible references mapped directly from JSON locales
export const ERROR_TRANSLATIONS_EN = TRANSLATIONS.en.errors as unknown as Record<string, TranslatedItem>;
export const UTILITY_METAS = TRANSLATIONS.en.utilities as unknown as Record<string, UtilityMeta>;

// Accessor functions read directly from active language JSON (vi.json, en.json, or future locales)
export const getErrorTitle = (error: PrinterError, lang: Language): string => {
  const item = (TRANSLATIONS[lang]?.errors as any)?.[error.id];
  return item?.title || error.name;
};

export const getErrorDesc = (error: PrinterError, lang: Language): string => {
  const item = (TRANSLATIONS[lang]?.errors as any)?.[error.id];
  return item?.desc || error.shortDesc;
};

export const getErrorRootCause = (error: PrinterError, lang: Language): string => {
  const item = (TRANSLATIONS[lang]?.errors as any)?.[error.id];
  return item?.rootCause || error.rootCause;
};

export const getErrorFixStep = (error: PrinterError, stepIdx: number, lang: Language): string => {
  const steps = (TRANSLATIONS[lang]?.errors as any)?.[error.id]?.fixSteps;
  if (Array.isArray(steps) && steps[stepIdx]) {
    return steps[stepIdx];
  }
  return error.fixSteps[stepIdx] || '';
};

export const getErrorRiskNote = (error: PrinterError, lang: Language): string | undefined => {
  const note = (TRANSLATIONS[lang]?.errors as any)?.[error.id]?.riskNote;
  return note || error.riskNote;
};

export const getUtilityTitle = (util: UtilityItem, lang: Language): string => {
  const item = (TRANSLATIONS[lang]?.utilities as any)?.[util.id];
  return item?.title || util.title;
};

export const getUtilityDesc = (util: UtilityItem, lang: Language): string => {
  const item = (TRANSLATIONS[lang]?.utilities as any)?.[util.id];
  return item?.desc || util.description;
};

export const getUtilityActionLabel = (util: UtilityItem, lang: Language): string => {
  const label = (TRANSLATIONS[lang]?.utilities as any)?.[util.id]?.actionLabel;
  if (typeof label === 'string') return label;
  return TRANSLATIONS[lang]?.fixBtn || 'FIX';
};

export const getUtilityStepTitle = (util: UtilityItem, stepIdx: number, lang: Language): string => {
  const titles = (TRANSLATIONS[lang]?.utilities as any)?.[util.id]?.stepTitles;
  if (Array.isArray(titles) && titles[stepIdx]) {
    return titles[stepIdx];
  }
  return util.steps[stepIdx]?.title || '';
};

export const getUtilityMeta = (utilId: string): UtilityMeta | undefined => {
  return (TRANSLATIONS.en.utilities as any)?.[utilId];
};
