import { createId } from './id';
import { defaultSubtitleStyle } from '../theme/tokens';
import type {
  Project,
  SubtitleBlock,
  SubtitleStyle,
  SubtitleWord,
} from '../types/models';

export const PLACEHOLDER_SUBTITLE_TEXT = 'Tap to add your first subtitle.';
const MIN_SUBTITLE_DURATION_MS = 160;
const MIN_SUBTITLE_WORD_DURATION_MS = 1;
const LEGACY_OFFSET_START_RATIO = 0.75;
const LEGACY_OFFSET_END_TOLERANCE_MS = 1500;
const KNOWN_OFFSET_ALIGNMENT_TOLERANCE_MS = 1000;
const KNOWN_OFFSET_MIN_COVERAGE_RATIO = 0.4;
const SUBTITLE_TOP_INSET_PX = 20;
const SUBTITLE_BOTTOM_INSET_PX = 18;
const SUBTITLE_SAFE_VERTICAL_INSET_PX = 16;
const SUBTITLE_MIDDLE_TOP_RATIO = 0.42;

const LEGACY_PLACEHOLDER_SUBTITLE_TEXTS = new Set([
  PLACEHOLDER_SUBTITLE_TEXT,
  'Tap to rewrite this subtitle.',
]);

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeSubtitleStyle(
  style?: Partial<SubtitleStyle> | null,
): SubtitleStyle {
  return {
    ...defaultSubtitleStyle,
    ...style,
  };
}

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function deriveProjectTitle(fileName?: string) {
  if (!fileName) {
    return 'Untitled Cut';
  }

  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  return withoutExtension
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 18) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

export function normalizeVideoUri(uri: string) {
  if (uri.startsWith('file://')) {
    return uri;
  }
  return `file://${uri}`;
}

export function isPlaceholderSubtitle(subtitle?: Pick<SubtitleBlock, 'text' | 'isPlaceholder'> | null) {
  if (!subtitle) {
    return false;
  }

  return (
    subtitle.isPlaceholder === true ||
    LEGACY_PLACEHOLDER_SUBTITLE_TEXTS.has(subtitle.text.trim())
  );
}

export function countRenderableSubtitles(subtitles: SubtitleBlock[]) {
  return subtitles.filter(subtitle => !isPlaceholderSubtitle(subtitle)).length;
}

export function createPlaceholderSubtitle(
  duration: number,
  text = PLACEHOLDER_SUBTITLE_TEXT,
) {
  return {
    id: createId('subtitle'),
    startTime: 0,
    endTime: Math.min(Math.max(duration, 1800), 3200),
    text,
    isGenerated: false,
    isPlaceholder: true,
  } satisfies SubtitleBlock;
}

export function ensureSubtitleOrder(subtitles: SubtitleBlock[]) {
  return [...subtitles].sort((left, right) => {
    if (left.startTime === right.startTime) {
      return left.endTime - right.endTime;
    }
    return left.startTime - right.startTime;
  });
}

function normalizeSubtitleWords(words?: SubtitleWord[]) {
  if (!words || words.length === 0) {
    return undefined;
  }

  const normalized = words
    .flatMap(word => {
      const text = word.text.trim();
      if (text.length === 0) {
        return [];
      }

      const startTime = Math.max(0, Math.round(word.startTime));
      const endTime = Math.max(
        startTime + MIN_SUBTITLE_WORD_DURATION_MS,
        Math.round(word.endTime),
      );

      return [
        {
          ...word,
          text,
          startTime,
          endTime,
        },
      ];
    })
    .sort((left, right) => {
      if (left.startTime === right.startTime) {
        return left.endTime - right.endTime;
      }
      return left.startTime - right.startTime;
    });

  return normalized.length > 0 ? normalized : undefined;
}

function mergeSubtitleWords(...groups: Array<SubtitleWord[] | undefined>) {
  return normalizeSubtitleWords(groups.flatMap(group => group ?? []));
}

export function offsetSubtitleWords(words: SubtitleWord[] | undefined, deltaMs: number) {
  const normalized = normalizeSubtitleWords(words);
  if (!normalized || deltaMs === 0) {
    return normalized;
  }

  return normalizeSubtitleWords(
    normalized.map(word => ({
      ...word,
      startTime: word.startTime + deltaMs,
      endTime: word.endTime + deltaMs,
    })),
  );
}

export function clampSubtitleWordsToRange(
  words: SubtitleWord[] | undefined,
  startTime: number,
  endTime: number,
) {
  const normalized = normalizeSubtitleWords(words);
  if (!normalized || endTime <= startTime) {
    return undefined;
  }

  const clamped = normalized.flatMap(word => {
    if (word.endTime <= startTime || word.startTime >= endTime) {
      return [];
    }

    const nextStart = clamp(
      word.startTime,
      startTime,
      endTime - MIN_SUBTITLE_WORD_DURATION_MS,
    );
    const nextEnd = clamp(
      word.endTime,
      nextStart + MIN_SUBTITLE_WORD_DURATION_MS,
      endTime,
    );

    return [
      {
        ...word,
        startTime: nextStart,
        endTime: nextEnd,
      },
    ];
  });

  return clamped.length > 0 ? clamped : undefined;
}

export function mergeSegmentsIntoBlocks(segments: SubtitleBlock[]) {
  if (segments.length === 0) {
    return [];
  }

  const ordered = ensureSubtitleOrder(segments);
  const merged: SubtitleBlock[] = [];

  for (const segment of ordered) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push({
        ...segment,
        words: normalizeSubtitleWords(segment.words),
      });
      continue;
    }

    const gap = segment.startTime - previous.endTime;
    const combinedText = `${previous.text} ${segment.text}`.trim();
    const shouldMerge =
      gap <= 220 &&
      combinedText.length <= 28 &&
      previous.endTime - previous.startTime <= 2200;

    if (shouldMerge) {
      previous.endTime = segment.endTime;
      previous.text = combinedText;
      previous.words = mergeSubtitleWords(previous.words, segment.words);
      previous.confidence = Math.min(
        previous.confidence ?? 1,
        segment.confidence ?? 1,
      );
      continue;
    }

    merged.push({
      ...segment,
      words: normalizeSubtitleWords(segment.words),
    });
  }

  return merged.map(block => ({
    ...block,
    text: block.text.replace(/\s+/g, ' ').trim(),
    words: clampSubtitleWordsToRange(block.words, block.startTime, block.endTime),
  }));
}

export interface EnsureSubtitlesOptions {
  knownOffsetMs?: number;
}

function shiftSubtitleTimes(subtitles: SubtitleBlock[], offsetMs: number) {
  if (offsetMs <= 0) {
    return subtitles;
  }

  return subtitles.map(block => ({
    ...block,
    startTime: block.startTime - offsetMs,
    endTime: block.endTime - offsetMs,
    words: offsetSubtitleWords(block.words, -offsetMs),
  }));
}

function resolveKnownOffsetToApply(
  subtitles: SubtitleBlock[],
  duration: number,
  knownOffsetMs?: number,
) {
  if (!knownOffsetMs || knownOffsetMs <= 0 || subtitles.length === 0) {
    return 0;
  }

  const firstStart = subtitles[0]?.startTime ?? 0;
  if (firstStart <= 0) {
    return 0;
  }

  const minExpectedStart = Math.max(0, knownOffsetMs - KNOWN_OFFSET_ALIGNMENT_TOLERANCE_MS);
  if (firstStart < minExpectedStart) {
    return 0;
  }

  const lastEnd = subtitles[subtitles.length - 1]?.endTime ?? firstStart;
  const coveredDuration = Math.max(0, lastEnd - firstStart);
  if (
    duration > 0 &&
    firstStart > duration * 0.25 &&
    coveredDuration < duration * KNOWN_OFFSET_MIN_COVERAGE_RATIO
  ) {
    return 0;
  }

  return Math.min(knownOffsetMs, firstStart);
}

function shouldApplyLegacyOffsetShift(subtitles: SubtitleBlock[], duration: number) {
  if (subtitles.length === 0) {
    return false;
  }

  const firstStart = subtitles[0]?.startTime ?? 0;
  const lastEnd = subtitles[subtitles.length - 1]?.endTime ?? 0;
  if (firstStart <= 0) {
    return false;
  }

  if (lastEnd > duration) {
    return true;
  }

  if (duration <= 0) {
    return false;
  }

  return (
    firstStart >= duration * LEGACY_OFFSET_START_RATIO &&
    lastEnd >= Math.max(0, duration - LEGACY_OFFSET_END_TOLERANCE_MS)
  );
}

export function ensureSubtitles(
  subtitles: SubtitleBlock[],
  duration: number,
  options: EnsureSubtitlesOptions = {},
) {
  let normalized = ensureSubtitleOrder(
    subtitles
      .map(block => {
        const startTime = Math.max(0, Math.round(block.startTime));
        const endTime = Math.max(
          Math.round(block.startTime + MIN_SUBTITLE_DURATION_MS),
          Math.round(block.endTime),
        );

        return {
          ...block,
          startTime,
          endTime,
          text: block.text.trim(),
          words: clampSubtitleWordsToRange(block.words, startTime, endTime),
        };
      })
      .filter(block => block.text.length > 0),
  );

  if (normalized.length === 0) {
    return [createPlaceholderSubtitle(duration)];
  }

  const knownOffsetMs = resolveKnownOffsetToApply(
    normalized,
    duration,
    options.knownOffsetMs,
  );
  if (knownOffsetMs > 0) {
    normalized = shiftSubtitleTimes(normalized, knownOffsetMs);
  }

  if (shouldApplyLegacyOffsetShift(normalized, duration)) {
    normalized = shiftSubtitleTimes(normalized, normalized[0]?.startTime ?? 0);
  }

  return normalized.map((block, index) => {
    const nextBlock = normalized[index + 1];
    const clampedEnd = clamp(
      block.endTime,
      block.startTime + MIN_SUBTITLE_DURATION_MS,
      Math.max(
        block.startTime + MIN_SUBTITLE_DURATION_MS,
        nextBlock ? nextBlock.startTime - 40 : duration,
      ),
    );

    return {
      ...block,
      endTime: clampedEnd,
      words: clampSubtitleWordsToRange(block.words, block.startTime, clampedEnd),
    };
  });
}

export function findActiveSubtitle(subtitles: SubtitleBlock[], playheadPosition: number) {
  return subtitles.find(
    subtitle =>
      playheadPosition >= subtitle.startTime && playheadPosition <= subtitle.endTime,
  );
}

export function findActiveSubtitleWordIndex(
  subtitle:
    | Pick<SubtitleBlock, 'endTime' | 'startTime' | 'text' | 'words' | 'isPlaceholder'>
    | null
    | undefined,
  playheadPosition: number,
) {
  const words = getRenderableSubtitleWords(subtitle);
  if (!words) {
    return -1;
  }

  return words.findIndex(
    word => playheadPosition >= word.startTime && playheadPosition <= word.endTime,
  );
}

export function hasTimedSubtitleWords(
  subtitle: Pick<SubtitleBlock, 'words'> | null | undefined,
) {
  return (normalizeSubtitleWords(subtitle?.words)?.length ?? 0) > 0;
}

function synthesizeSubtitleWords(
  subtitle: Pick<SubtitleBlock, 'endTime' | 'startTime' | 'text'> | null | undefined,
) {
  if (!subtitle || isPlaceholderSubtitle(subtitle)) {
    return undefined;
  }

  const tokens = subtitle.text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return undefined;
  }

  const duration = Math.max(1, subtitle.endTime - subtitle.startTime);

  return normalizeSubtitleWords(
    tokens.map((text, index) => {
      const startTime = Math.round(
        subtitle.startTime + (duration * index) / tokens.length,
      );
      const endTime =
        index === tokens.length - 1
          ? subtitle.endTime
          : Math.round(
              subtitle.startTime + (duration * (index + 1)) / tokens.length,
            );

      return {
        text,
        startTime,
        endTime: Math.max(startTime + MIN_SUBTITLE_WORD_DURATION_MS, endTime),
      };
    }),
  );
}

export function getRenderableSubtitleWords(
  subtitle:
    | Pick<SubtitleBlock, 'endTime' | 'startTime' | 'text' | 'words' | 'isPlaceholder'>
    | null
    | undefined,
) {
  return normalizeSubtitleWords(subtitle?.words) ?? synthesizeSubtitleWords(subtitle);
}

export function hasRenderableSubtitleWords(
  subtitle:
    | Pick<SubtitleBlock, 'endTime' | 'startTime' | 'text' | 'words' | 'isPlaceholder'>
    | null
    | undefined,
) {
  return (getRenderableSubtitleWords(subtitle)?.length ?? 0) > 0;
}

export function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function applySubtitleCasing(text: string, style: SubtitleStyle) {
  return style.casing === 'uppercase' ? text.toUpperCase() : text;
}

export function normalizeEditableSubtitleText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function isSameEditableSubtitleText(currentText: string, nextText: string) {
  return normalizeEditableSubtitleText(currentText) === normalizeEditableSubtitleText(nextText);
}

function subtitleAnchorTop(
  position: SubtitleStyle['position'],
  videoHeight: number,
  subtitleHeight: number,
) {
  switch (position) {
    case 'top':
      return SUBTITLE_TOP_INSET_PX;
    case 'middle':
      return videoHeight * SUBTITLE_MIDDLE_TOP_RATIO;
    default:
      return videoHeight - subtitleHeight - SUBTITLE_BOTTOM_INSET_PX;
  }
}

export function clampSubtitleVerticalOrigin(
  top: number,
  videoHeight: number,
  subtitleHeight: number,
) {
  const { maxTop, minTop } = getSubtitleVerticalBounds(videoHeight, subtitleHeight);

  return clamp(top, minTop, maxTop);
}

export function getSubtitleVerticalBounds(
  videoHeight: number,
  subtitleHeight: number,
) {
  return {
    minTop: SUBTITLE_SAFE_VERTICAL_INSET_PX,
    maxTop: Math.max(
      SUBTITLE_SAFE_VERTICAL_INSET_PX,
      videoHeight - subtitleHeight - SUBTITLE_SAFE_VERTICAL_INSET_PX,
    ),
  };
}

export function getSubtitleVerticalOrigin(
  style: Pick<SubtitleStyle, 'position' | 'positionOffsetYRatio'>,
  videoHeight: number,
  subtitleHeight: number,
) {
  const normalizedStyle = normalizeSubtitleStyle(style);
  const anchorTop = subtitleAnchorTop(
    normalizedStyle.position,
    videoHeight,
    subtitleHeight,
  );

  return clampSubtitleVerticalOrigin(
    anchorTop + normalizedStyle.positionOffsetYRatio * videoHeight,
    videoHeight,
    subtitleHeight,
  );
}

export function setSubtitlePositionPreset(
  style: SubtitleStyle,
  position: SubtitleStyle['position'],
) {
  return {
    ...style,
    position,
    positionOffsetYRatio: 0,
  } satisfies SubtitleStyle;
}

export function resolveSubtitleStyleFromVerticalOrigin(
  style: SubtitleStyle,
  targetTop: number,
  videoHeight: number,
  subtitleHeight: number,
) {
  const clampedTop = clampSubtitleVerticalOrigin(
    targetTop,
    videoHeight,
    subtitleHeight,
  );
  const currentAnchorTop = subtitleAnchorTop(
    style.position,
    videoHeight,
    subtitleHeight,
  );

  return {
    ...style,
    position: style.position,
    positionOffsetYRatio:
      videoHeight > 0 ? (clampedTop - currentAnchorTop) / videoHeight : 0,
  } satisfies SubtitleStyle;
}

export function applyManualSubtitleTextEdit(subtitle: SubtitleBlock, text: string) {
  if (isSameEditableSubtitleText(subtitle.text, text)) {
    return subtitle;
  }

  return {
    ...subtitle,
    text,
    words: undefined,
    isGenerated: false,
    isPlaceholder: false,
  } satisfies SubtitleBlock;
}

export function snapSubtitleRange(
  subtitles: SubtitleBlock[],
  currentBlockId: string,
  nextStart: number,
  nextEnd: number,
  duration: number,
) {
  let snappedStart = clamp(nextStart, 0, duration);
  let snappedEnd = clamp(nextEnd, snappedStart + 160, duration);
  const snapThreshold = 120;

  for (const block of subtitles) {
    if (block.id === currentBlockId) {
      continue;
    }
    if (Math.abs(block.endTime - snappedStart) <= snapThreshold) {
      snappedStart = block.endTime;
    }
    if (Math.abs(block.startTime - snappedEnd) <= snapThreshold) {
      snappedEnd = block.startTime;
    }
  }

  return {
    startTime: clamp(snappedStart, 0, Math.max(0, duration - 160)),
    endTime: clamp(snappedEnd, snappedStart + 160, duration),
  };
}

export function buildProjectDefaults() {
  return {
    globalStyle: defaultSubtitleStyle,
    waveform: Array.from({ length: 120 }, (_, index) =>
      0.16 + Math.sin(index / 6) * 0.1 + (index % 5 === 0 ? 0.18 : 0),
    ),
  };
}
