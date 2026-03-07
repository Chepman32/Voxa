import { createId } from './id';
import { defaultSubtitleStyle } from '../theme/tokens';
import type { Project, SubtitleBlock, SubtitleStyle } from '../types/models';

export const PLACEHOLDER_SUBTITLE_TEXT = 'Tap to add your first subtitle.';
const MIN_SUBTITLE_DURATION_MS = 160;
const LEGACY_OFFSET_START_RATIO = 0.75;
const LEGACY_OFFSET_END_TOLERANCE_MS = 1500;
const KNOWN_OFFSET_ALIGNMENT_TOLERANCE_MS = 1000;

const LEGACY_PLACEHOLDER_SUBTITLE_TEXTS = new Set([
  PLACEHOLDER_SUBTITLE_TEXT,
  'Tap to rewrite this subtitle.',
]);

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

export function mergeSegmentsIntoBlocks(segments: SubtitleBlock[]) {
  if (segments.length === 0) {
    return [];
  }

  const ordered = ensureSubtitleOrder(segments);
  const merged: SubtitleBlock[] = [];

  for (const segment of ordered) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push({ ...segment });
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
      previous.confidence = Math.min(
        previous.confidence ?? 1,
        segment.confidence ?? 1,
      );
      continue;
    }

    merged.push({ ...segment });
  }

  return merged.map(block => ({
    ...block,
    text: block.text.replace(/\s+/g, ' ').trim(),
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
  }));
}

function resolveKnownOffsetToApply(subtitles: SubtitleBlock[], knownOffsetMs?: number) {
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
      .map(block => ({
        ...block,
        startTime: Math.max(0, Math.round(block.startTime)),
        endTime: Math.max(
          Math.round(block.startTime + MIN_SUBTITLE_DURATION_MS),
          Math.round(block.endTime),
        ),
        text: block.text.trim(),
      }))
      .filter(block => block.text.length > 0),
  );

  if (normalized.length === 0) {
    return [createPlaceholderSubtitle(duration)];
  }

  const knownOffsetMs = resolveKnownOffsetToApply(normalized, options.knownOffsetMs);
  if (knownOffsetMs > 0) {
    normalized = shiftSubtitleTimes(normalized, knownOffsetMs);
  }

  if (shouldApplyLegacyOffsetShift(normalized, duration)) {
    normalized = shiftSubtitleTimes(normalized, normalized[0]?.startTime ?? 0);
  }

  return normalized.map((block, index) => {
    const nextBlock = normalized[index + 1];
    const maxEnd = nextBlock ? nextBlock.startTime - 40 : duration;
    return {
      ...block,
      endTime: clamp(
        block.endTime,
        block.startTime + MIN_SUBTITLE_DURATION_MS,
        Math.max(block.startTime + MIN_SUBTITLE_DURATION_MS, maxEnd),
      ),
    };
  });
}

export function findActiveSubtitle(subtitles: SubtitleBlock[], playheadPosition: number) {
  return subtitles.find(
    subtitle =>
      playheadPosition >= subtitle.startTime && playheadPosition <= subtitle.endTime,
  );
}

export function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function applySubtitleCasing(text: string, style: SubtitleStyle) {
  return style.casing === 'uppercase' ? text.toUpperCase() : text;
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
