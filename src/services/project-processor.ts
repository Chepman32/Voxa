import type { Asset } from 'react-native-image-picker';

import { createId } from '../lib/id';
import {
  buildProjectDefaults,
  deriveProjectTitle,
  ensureSubtitles,
  mergeSegmentsIntoBlocks,
  normalizeVideoUri,
} from '../lib/project';
import { defaultSubtitleStyle } from '../theme/tokens';
import { prepareProject } from './native-voxa';
import type { Project, RecognitionStatus } from '../types/models';

function wait(duration: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, duration);
  });
}

interface ProjectPhaseHandler {
  (phase: 'extracting' | 'recognizing' | 'composing', label: string): void;
}

export async function buildProjectFromAsset(
  asset: Asset,
  speechLocale: string,
  onPhaseChange?: ProjectPhaseHandler,
) {
  const uri = normalizeVideoUri(asset.uri ?? asset.originalPath ?? '');
  const fallbackDuration = Math.max(8000, Math.round((asset.duration ?? 12) * 1000));

  onPhaseChange?.('extracting', 'Extracting audio...');
  const nativeTask = prepareProject(uri, speechLocale, fallbackDuration);

  await wait(220);
  onPhaseChange?.('recognizing', 'Analyzing speech locally...');

  const result = await nativeTask;

  onPhaseChange?.('composing', 'Generating timeline...');
  await wait(160);

  const mergedSubtitles = ensureSubtitles(
    mergeSegmentsIntoBlocks(
      result.subtitles.map(segment => ({
        ...segment,
        id: segment.id || createId('subtitle'),
        isGenerated: true,
      })),
    ),
    result.duration || fallbackDuration,
    { knownOffsetMs: result.transcriptTimeOffsetMs },
  );

  return {
    id: createId('project'),
    title: deriveProjectTitle(asset.fileName),
    sourceFileName: asset.fileName ?? 'Imported video',
    videoLocalURI: uri,
    thumbnailUri: result.thumbnailUri,
    duration: result.duration || fallbackDuration,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    subtitles: mergedSubtitles,
    globalStyle: defaultSubtitleStyle,
    waveform: result.waveform.length > 0 ? result.waveform : buildProjectDefaults().waveform,
    recognitionStatus: result.recognitionStatus,
    importError: result.errorMessage,
    metrics: {
      width: result.width || 1080,
      height: result.height || 1920,
    },
    lastEditedSubtitleId: mergedSubtitles[0]?.id,
  } satisfies Project;
}

export function buildManualFallbackProject(asset: Asset, error: unknown) {
  const defaults = buildProjectDefaults();
  const duration = Math.max(8000, Math.round((asset.duration ?? 12) * 1000));
  const message = error instanceof Error ? error.message : 'Subtitle generation failed.';

  return {
    id: createId('project'),
    title: deriveProjectTitle(asset.fileName),
    sourceFileName: asset.fileName ?? 'Imported video',
    videoLocalURI: normalizeVideoUri(asset.uri ?? asset.originalPath ?? ''),
    thumbnailUri: undefined,
    duration,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    subtitles: ensureSubtitles([], duration),
    globalStyle: defaultSubtitleStyle,
    waveform: defaults.waveform,
    recognitionStatus: 'failed' as RecognitionStatus,
    importError: message,
    metrics: {
      width: 1080,
      height: 1920,
    },
  } satisfies Project;
}
