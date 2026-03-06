import { createId } from './id';
import { defaultSubtitleStyle } from '../theme/tokens';
import type { Project, SubtitleBlock, SubtitleStyle } from '../types/models';

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

export function createPlaceholderSubtitle(duration: number, text = 'Tap to rewrite this subtitle.') {
  return {
    id: createId('subtitle'),
    startTime: 0,
    endTime: Math.min(Math.max(duration, 1800), 3200),
    text,
    isGenerated: false,
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

export function ensureSubtitles(subtitles: SubtitleBlock[], duration: number) {
  const normalized = ensureSubtitleOrder(
    subtitles
      .map(block => ({
        ...block,
        startTime: Math.max(0, Math.round(block.startTime)),
        endTime: Math.max(Math.round(block.startTime + 160), Math.round(block.endTime)),
        text: block.text.trim(),
      }))
      .filter(block => block.text.length > 0),
  );

  if (normalized.length === 0) {
    return [createPlaceholderSubtitle(duration)];
  }

  return normalized.map((block, index) => {
    const nextBlock = normalized[index + 1];
    const maxEnd = nextBlock ? nextBlock.startTime - 40 : duration;
    return {
      ...block,
      endTime: clamp(block.endTime, block.startTime + 160, Math.max(block.startTime + 160, maxEnd)),
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
