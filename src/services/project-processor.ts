import type { Asset } from 'react-native-image-picker';

import { createId } from '../lib/id';
import {
  buildProjectDefaults,
  ensureSubtitles,
  expandCoarseSubtitleSegments,
  mergeSegmentsIntoBlocks,
  normalizeVideoUri,
} from '../lib/project';
import { deriveProjectTitle } from '../lib/project-title';
import { normalizeSpeechLocale } from '../lib/speech-locale';
import { defaultSubtitleStyle } from '../theme/tokens';
import {
  persistProjectVideo,
  prepareProject,
  resolveProjectMedia,
} from './native-localsub';
import type { SpeechModelDownloadEvent } from './native-localsub';
import type { Project, RecognitionStatus } from '../types/models';

function wait(duration: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, duration);
  });
}

interface ProjectPhaseHandler {
  (
    phase: 'extracting' | 'downloading' | 'recognizing' | 'composing',
    label: string,
    progress?: number | null,
  ): void;
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
  const normalizedLocaleOverride = normalizeSpeechLocale(localeOverride);
  let isDownloadingSpeechModel = false;
  onPhaseChange?.('extracting', 'Extracting audio...');
  const nativeTask = prepareProject(
    videoURI,
    normalizedLocaleOverride,
    fallbackDuration,
    (event: SpeechModelDownloadEvent) => {
      isDownloadingSpeechModel = event.status === 'downloading';
      if (isDownloadingSpeechModel) {
        onPhaseChange?.(
          'downloading',
          'Downloading speech model...',
          event.progress,
        );
      } else {
        onPhaseChange?.(
          'recognizing',
          resolveRecognitionLabel(normalizedLocaleOverride),
        );
      }
    },
  );

  await wait(220);
  if (!isDownloadingSpeechModel) {
    onPhaseChange?.(
      'recognizing',
      resolveRecognitionLabel(normalizedLocaleOverride),
    );
  }

  if (!normalizedLocaleOverride && !isDownloadingSpeechModel) {
    await wait(320);
    if (!isDownloadingSpeechModel) {
      onPhaseChange?.(
        'recognizing',
        'Transcribing with the best on-device language...',
      );
    }
  }

  const result = await nativeTask;

  onPhaseChange?.('composing', 'Generating timeline...');
  await wait(160);

  const mergedSubtitles = ensureSubtitles(
    mergeSegmentsIntoBlocks(
      expandCoarseSubtitleSegments(
        result.subtitles.map(segment => ({
          ...segment,
          id: segment.id || createId('subtitle'),
          isGenerated: true,
        })),
      ),
    ),
    result.duration || fallbackDuration,
    { knownOffsetMs: result.transcriptTimeOffsetMs },
  );

  return {
    ...result,
    recognitionLocale:
      normalizeSpeechLocale(result.recognitionLocale) ??
      result.recognitionLocale,
    mergedSubtitles,
  };
}

function getAssetVideoUri(asset: Asset) {
  return normalizeVideoUri(asset.uri ?? asset.originalPath ?? '');
}

export async function buildProjectFromAsset(
  asset: Asset,
  localeOverride: string | null = null,
  onPhaseChange?: ProjectPhaseHandler,
) {
  const uri = getAssetVideoUri(asset);
  const fallbackDuration = Math.max(
    8000,
    Math.round((asset.duration ?? 12) * 1000),
  );
  const result = await prepareProjectResult({
    fallbackDuration,
    localeOverride,
    onPhaseChange,
    videoURI: uri,
  });
  const now = Date.now();

  return {
    id: createId('project'),
    title: deriveProjectTitle(result.mergedSubtitles, now),
    sourceFileName: asset.fileName ?? 'Imported video',
    videoLocalURI: result.videoUri ?? uri,
    videoFileName: result.videoFileName,
    thumbnailUri: result.thumbnailUri,
    thumbnailFileName: result.thumbnailFileName,
    duration: result.duration || fallbackDuration,
    createdAt: now,
    updatedAt: now,
    subtitles: result.mergedSubtitles,
    globalStyle: defaultSubtitleStyle,
    waveform:
      result.waveform.length > 0
        ? result.waveform
        : buildProjectDefaults().waveform,
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
  const fallbackDuration = Math.max(
    8000,
    Math.round(project.duration || 12000),
  );
  const result = await prepareProjectResult({
    fallbackDuration,
    localeOverride,
    onPhaseChange,
    videoURI: project.videoLocalURI,
  });

  return {
    ...project,
    videoLocalURI: result.videoUri ?? project.videoLocalURI,
    videoFileName: result.videoFileName ?? project.videoFileName,
    thumbnailUri: result.thumbnailUri ?? project.thumbnailUri,
    thumbnailFileName: result.thumbnailFileName ?? project.thumbnailFileName,
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
  const message =
    error instanceof Error ? error.message : 'Subtitle generation failed.';
  const videoUri = getAssetVideoUri(asset);
  const now = Date.now();
  const subtitles = ensureSubtitles([], duration);

  return {
    id: createId('project'),
    title: deriveProjectTitle(subtitles, now),
    sourceFileName: asset.fileName ?? 'Imported video',
    videoLocalURI: videoUri,
    thumbnailUri: undefined,
    duration,
    createdAt: now,
    updatedAt: now,
    subtitles,
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

export async function buildPersistedManualFallbackProject(
  asset: Asset,
  error: unknown,
) {
  const project = buildManualFallbackProject(asset, error);
  const media = await persistProjectVideo(project.videoLocalURI).catch(
    () => null,
  );

  return {
    ...project,
    videoLocalURI: media?.videoUri ?? project.videoLocalURI,
    videoFileName: media?.videoFileName,
  } satisfies Project;
}

export async function repairProjectMedia(project: Project) {
  const media = await resolveProjectMedia({
    videoURI: project.videoLocalURI,
    videoFileName: project.videoFileName,
    thumbnailUri: project.thumbnailUri,
    thumbnailFileName: project.thumbnailFileName,
  });

  const repairedProject = {
    ...project,
    videoLocalURI: media.videoUri ?? project.videoLocalURI,
    videoFileName: media.videoFileName ?? project.videoFileName,
    thumbnailUri: media.thumbnailUri ?? project.thumbnailUri,
    thumbnailFileName: media.thumbnailFileName ?? project.thumbnailFileName,
  } satisfies Project;

  const changed =
    repairedProject.videoLocalURI !== project.videoLocalURI ||
    repairedProject.videoFileName !== project.videoFileName ||
    repairedProject.thumbnailUri !== project.thumbnailUri ||
    repairedProject.thumbnailFileName !== project.thumbnailFileName;

  return changed ? repairedProject : project;
}
