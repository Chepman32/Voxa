import type { SpeechLocaleOption } from '../types/models';

export function normalizeSpeechLocale(locale: string | null | undefined) {
  const parts = locale?.trim().replace(/_/g, '-').split('-').filter(Boolean);

  if (!parts || parts.length === 0) {
    return null;
  }

  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.toLowerCase();
      }
      if (/^[a-z]{4}$/i.test(part)) {
        return `${part[0]?.toUpperCase()}${part.slice(1).toLowerCase()}`;
      }
      if (/^[a-z]{2}$/i.test(part)) {
        return part.toUpperCase();
      }
      return part.toLowerCase();
    })
    .join('-');
}

export function findSpeechLocaleOption(
  locale: string | null | undefined,
  options: SpeechLocaleOption[],
) {
  if (!locale) {
    return undefined;
  }

  const normalizedLocale = normalizeSpeechLocale(locale);
  const exactMatch = options.find(
    option => normalizeSpeechLocale(option.value) === normalizedLocale,
  );

  if (exactMatch || normalizedLocale?.includes('-')) {
    return exactMatch;
  }

  return options.find(
    option =>
      normalizeSpeechLocale(option.value)?.split('-')[0] === normalizedLocale,
  );
}

export function resolveRememberedSpeechLocale(
  locale: string | null,
  options: SpeechLocaleOption[],
) {
  return findSpeechLocaleOption(locale, options)?.value ?? null;
}
