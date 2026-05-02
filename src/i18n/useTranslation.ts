import { useMemo } from 'react';

import { useAppStore } from '../store/app-store';
import { translations, type SupportedLocale } from './translations';

export function useTranslation() {
  const uiLocale = useAppStore(state => state.uiLocale);

  const t = useMemo(() => {
    const locale = uiLocale ?? 'en';
    const dict = translations[locale] ?? translations.en;

    return (key: string): string => {
      return (dict as unknown as Record<string, string>)[key] ?? (translations.en as unknown as Record<string, string>)[key] ?? key;
    };
  }, [uiLocale]);

  return { t, locale: (uiLocale ?? 'en') as SupportedLocale };
}
