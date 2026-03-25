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

interface ProjectPreparationInput {
  fallbackDuration: number;
  localeOverride?: string | null;
  onPhaseChange?: ProjectPhaseHandler;
  videoURI: string;
}

function resolveRecognitionLabel(localeOverride?: string | null) {
  if (localeOverride) {
    return 'Transcribing with the selected language...';
  }

  return 'Detecting spoken language...';
}

async function prepareProjectResult({
  fallbackDuration,
  localeOverride = null,
  onPhaseChange,
  videoURI,
}: ProjectPreparationInput) {
  onPhaseChange?.('extracting', 'Extracting audio...');
  const nativeTask = prepareProject(videoURI, localeOverride, fallbackDuration);

  await wait(220);
  onPhaseChange?.('recognizing', resolveRecognitionLabel(localeOverride));

  if (!localeOverride) {
    await wait(320);
    onPhaseChange?.('recognizing', 'Transcribing with the best on-device language...');
  }

  const result = await nativeTask;

  onPhaseChange?.('composing', 'Generating timeline...');
  await wait(160);

  const mergedSubtitles = ensureSubtitles(
    mergeSegmentsIntoBlocks(
      result.subtitles.map(segment => ({
        ...segment,
        id: segment.id || createId('subtitle'),
        isGenerated: true,
        words:
          segment.words && segment.words.length > 0
            ? segment.words
            : [
                {
                  text: segment.text,
                  startTime: segment.startTime,
                  endTime: segment.endTime,
                  confidence: segment.confidence,
                },
              ],
      })),
    ),
    result.duration || fallbackDuration,
    { knownOffsetMs: result.transcriptTimeOffsetMs },
  );

  return {
    ...result,
    mergedSubtitles,
  };
}

export async function buildProjectFromAsset(
  asset: Asset,
  localeOverride: string | null = null,
  onPhaseChange?: ProjectPhaseHandler,
) {
  const uri = normalizeVideoUri(asset.uri ?? asset.originalPath ?? '');
  const fallbackDuration = Math.max(8000, Math.round((asset.duration ?? 12) * 1000));
  const result = await prepareProjectResult({
    fallbackDuration,
    localeOverride,
    onPhaseChange,
    videoURI: uri,
  });

  return {
    id: createId('project'),
    title: deriveProjectTitle(asset.fileName),
    sourceFileName: asset.fileName ?? 'Imported video',
    videoLocalURI: uri,
    thumbnailUri: result.thumbnailUri,
    duration: result.duration || fallbackDuration,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    subtitles: result.mergedSubtitles,
    globalStyle: defaultSubtitleStyle,
    waveform: result.waveform.length > 0 ? result.waveform : buildProjectDefaults().waveform,
    recognitionStatus: result.recognitionStatus,
    recognitionLocale: result.recognitionLocale,
    recognitionMode: result.recognitionMode,
    importError: result.errorMessage,
    metrics: {
      width: result.width || 1080,
      height: result.height || 1920,
    },
    lastEditedSubtitleId: result.mergedSubtitles[0]?.id,
  } satisfies Project;
}

export async function retryProjectSubtitles(
  project: Project,
  localeOverride: string | null = null,
  onPhaseChange?: ProjectPhaseHandler,
) {
  const fallbackDuration = Math.max(8000, Math.round(project.duration || 12000));
  const result = await prepareProjectResult({
    fallbackDuration,
    localeOverride,
    onPhaseChange,
    videoURI: project.videoLocalURI,
  });

  return {
    ...project,
    thumbnailUri: result.thumbnailUri ?? project.thumbnailUri,
    duration: result.duration || fallbackDuration,
    updatedAt: Date.now(),
    subtitles: result.mergedSubtitles,
    waveform: result.waveform.length > 0 ? result.waveform : project.waveform,
    recognitionStatus: result.recognitionStatus,
    recognitionLocale: result.recognitionLocale,
    recognitionMode: result.recognitionMode,
    importError: result.errorMessage,
    metrics: {
      width: result.width || project.metrics.width || 1080,
      height: result.height || project.metrics.height || 1920,
    },
    lastEditedSubtitleId: result.mergedSubtitles[0]?.id,
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
    recognitionMode: 'auto',
    importError: message,
    metrics: {
      width: 1080,
      height: 1920,
    },
  } satisfies Project;
}
