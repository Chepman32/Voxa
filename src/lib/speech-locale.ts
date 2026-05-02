import type { SpeechLocaleOption, SupportedLocale } from '../types/models';

export const APP_LANGUAGE_LOCALE_VALUE = '__app_language__';

export function getLocaleBase(locale: string) {
  return locale.replace(/_/g, '-').split('-')[0]?.toLowerCase() ?? locale.toLowerCase();
}

export function findSpeechLocaleOption(
  locale: string | null | undefined,
  options: SpeechLocaleOption[],
) {
  if (!locale) {
    return undefined;
  }

  return options.find(option => option.value.toLowerCase() === locale.toLowerCase());
}

export function resolveAppSpeechLocale(
  appLocale: SupportedLocale,
  options: SpeechLocaleOption[],
) {
  const base = getLocaleBase(appLocale);
  const exactBaseMatch = options.find(
    option => option.value.toLowerCase() === base,
  );
  const regionalMatch = options.find(option => getLocaleBase(option.value) === base);

  return exactBaseMatch?.value ?? regionalMatch?.value ?? null;
}

export function resolveRememberedSpeechLocale(
  locale: string | null,
  options: SpeechLocaleOption[],
) {
  return findSpeechLocaleOption(locale, options)?.value ?? null;
}
