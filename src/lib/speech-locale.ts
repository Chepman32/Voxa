import type { SpeechLocaleOption } from '../types/models';

export const AUTO_DETECT_LOCALE_VALUE = '__auto_detect__';

export function findSpeechLocaleOption(
  locale: string | null | undefined,
  options: SpeechLocaleOption[],
) {
  if (!locale) {
    return undefined;
  }

  return options.find(option => option.value.toLowerCase() === locale.toLowerCase());
}

export function resolveRememberedSpeechLocale(
  locale: string | null,
  options: SpeechLocaleOption[],
) {
  return findSpeechLocaleOption(locale, options)?.value ?? null;
}
