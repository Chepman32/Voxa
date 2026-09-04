import { ensureSubtitleOrder, isPlaceholderSubtitle } from './project';
import type { SubtitleBlock } from '../types/models';

const PROJECT_TITLE_WORD_LIMIT = 5;

export function formatProjectCreationDate(createdAt: number, locale?: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));
}

export function deriveProjectTitle(
  subtitles: SubtitleBlock[],
  createdAt: number,
  locale?: string,
) {
  const words = ensureSubtitleOrder(subtitles)
    .filter(subtitle => !isPlaceholderSubtitle(subtitle))
    .flatMap(subtitle => subtitle.text.trim().split(/\s+/))
    .filter(Boolean)
    .slice(0, PROJECT_TITLE_WORD_LIMIT);

  return words.length > 0
    ? words.join(' ')
    : formatProjectCreationDate(createdAt, locale);
}
