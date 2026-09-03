import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';

import { createId } from '../lib/id';
import type {
  ExportResolution,
  PermissionSummary,
  RecognitionMode,
  SpeechLocaleOption,
  SubtitleStyle,
  SubtitleWord,
} from '../types/models';

export interface NativeSubtitleWord extends SubtitleWord {}

export interface NativeSubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: NativeSubtitleWord[];
  confidence?: number;
}

interface PrepareProjectResponse {
  duration: number;
  videoUri?: string;
  videoFileName?: string;
  thumbnailUri?: string;
  thumbnailFileName?: string;
  width: number;
  height: number;
  waveform: number[];
  subtitles: NativeSubtitleSegment[];
  transcriptTimeOffsetMs: number;
  recognitionStatus: 'ready' | 'manual' | 'failed';
  recognitionLocale?: string;
  recognitionMode: RecognitionMode;
  errorMessage?: string;
}

interface ExportResponse {
  outputUri: string;
}

interface SaveResponse {
  localIdentifier: string;
}

interface PersistVideoResponse {
  videoUri: string;
  videoFileName?: string;
}

interface ResolveProjectMediaResponse {
  videoUri?: string;
  videoFileName?: string;
  thumbnailUri?: string;
  thumbnailFileName?: string;
}

export interface SpeechModelDownloadEvent {
  localeTag: string;
  status: 'downloading' | 'ready';
  progress: number | null;
}

export const SPEECH_MODEL_DOWNLOAD_EVENT = 'LocalSubSpeechModelDownloadProgress';

interface LocalSubNativeModule {
  requestAuthorizations(): Promise<PermissionSummary>;
  getSpeechAuthorizationStatus(): Promise<PermissionSummary['speech']>;
  requestSpeechAuthorization(): Promise<PermissionSummary['speech']>;
  getDeviceLocale(): Promise<string>;
  getAvailableSpeechLocales(): Promise<SpeechLocaleOption[]>;
  prepareProject(
    videoURI: string,
    localeOverride: string | null,
  ): Promise<PrepareProjectResponse>;
  persistProjectVideo(videoURI: string): Promise<PersistVideoResponse>;
  resolveProjectMedia(payload: {
    videoURI?: string;
    videoFileName?: string;
    thumbnailUri?: string;
    thumbnailFileName?: string;
  }): Promise<ResolveProjectMediaResponse>;
  exportProject(payload: {
    videoURI: string;
    subtitles: NativeSubtitleSegment[];
    style: SubtitleStyle;
    resolution: ExportResolution;
  }): Promise<ExportResponse>;
  saveVideoToPhotos(videoURI: string): Promise<SaveResponse>;
}

const nativeModule = NativeModules.LocalSubOfflineModule as
  | LocalSubNativeModule
  | undefined;

function requireNativeMethod<K extends keyof LocalSubNativeModule>(methodName: K) {
  if (!nativeModule?.[methodName]) {
    throw new Error(`LocalSubOfflineModule.${String(methodName)} is unavailable.`);
  }

  return nativeModule[methodName];
}

function createMockWaveform(count = 160) {
  return Array.from({ length: count }, (_, index) => {
    const swell = 0.18 + Math.abs(Math.sin(index / 9)) * 0.28;
    const accent = index % 17 === 0 ? 0.2 : 0;
    return Math.min(0.94, swell + accent);
  });
}

function createMockSubtitles(duration = 12000): NativeSubtitleSegment[] {
  const phrases = [
    'Offline',
    'subtitle',
    'editing',
    'begins',
    'with',
    'your',
    'local',
    'video',
  ];

  return phrases.map((word, index) => {
    const startTime = index * 1150;
    return {
      id: createId('native'),
      startTime,
      endTime: Math.min(duration, startTime + 820),
      text: word,
      words: [
        {
          text: word,
          startTime,
          endTime: Math.min(duration, startTime + 820),
          confidence: 0.95,
        },
      ],
      confidence: 0.95,
    };
  });
}

export async function requestAuthorizations() {
  if (nativeModule?.requestAuthorizations) {
    return nativeModule.requestAuthorizations();
  }

  if (Platform.OS !== 'ios') {
    return {
      photoLibrary: 'authorized',
      photoAddOnly: 'authorized',
      speech: 'authorized',
    } satisfies PermissionSummary;
  }

  return requireNativeMethod('requestAuthorizations')();
}

export async function getSpeechAuthorizationStatus() {
  if (nativeModule?.getSpeechAuthorizationStatus) {
    return nativeModule.getSpeechAuthorizationStatus();
  }

  if (Platform.OS !== 'ios') {
    return 'authorized' satisfies PermissionSummary['speech'];
  }

  return requireNativeMethod('getSpeechAuthorizationStatus')();
}

export async function requestSpeechAuthorization() {
  if (nativeModule?.requestSpeechAuthorization) {
    return nativeModule.requestSpeechAuthorization();
  }

  if (Platform.OS !== 'ios') {
    return 'authorized' satisfies PermissionSummary['speech'];
  }

  return requireNativeMethod('requestSpeechAuthorization')();
}

export async function getDeviceLocale() {
  if (nativeModule?.getDeviceLocale) {
    return nativeModule.getDeviceLocale();
  }

  if (Platform.OS !== 'ios') {
    return 'en-US';
  }

  return requireNativeMethod('getDeviceLocale')();
}

export async function getAvailableSpeechLocales() {
  if (nativeModule?.getAvailableSpeechLocales) {
    return nativeModule.getAvailableSpeechLocales();
  }

  if (Platform.OS !== 'ios') {
    return [
      { label: 'English (United States)', value: 'en-US' },
      { label: 'English (United Kingdom)', value: 'en-GB' },
      { label: 'Russian', value: 'ru-RU' },
    ] satisfies SpeechLocaleOption[];
  }

  return requireNativeMethod('getAvailableSpeechLocales')();
}

export async function prepareProject(
  videoURI: string,
  localeOverride: string | null,
  fallbackDuration = 12000,
  onModelDownloadProgress?: (event: SpeechModelDownloadEvent) => void,
) {
  const requestedLocale = localeOverride?.replace(/_/g, '-').toLowerCase();
  const progressSubscription =
    Platform.OS === 'android' &&
    nativeModule?.prepareProject &&
    onModelDownloadProgress
      ? DeviceEventEmitter.addListener(
          SPEECH_MODEL_DOWNLOAD_EVENT,
          (event: SpeechModelDownloadEvent) => {
            const eventLocale = event.localeTag
              ?.replace(/_/g, '-')
              .toLowerCase();
            if (requestedLocale && eventLocale !== requestedLocale) {
              return;
            }
            onModelDownloadProgress(event);
          },
        )
      : undefined;

  try {
    if (nativeModule?.prepareProject) {
      return await nativeModule.prepareProject(videoURI, localeOverride);
    }

    if (Platform.OS !== 'ios') {
      return {
        duration: fallbackDuration,
        videoUri: videoURI,
        videoFileName: undefined,
        width: 1080,
        height: 1920,
        waveform: createMockWaveform(),
        subtitles: createMockSubtitles(fallbackDuration),
        transcriptTimeOffsetMs: 0,
        recognitionStatus: 'ready',
        recognitionLocale: localeOverride ?? 'en-US',
        recognitionMode: localeOverride ? 'manual' : 'auto',
      } satisfies PrepareProjectResponse;
    }

    return await requireNativeMethod('prepareProject')(
      videoURI,
      localeOverride,
    );
  } finally {
    progressSubscription?.remove();
  }
}

export async function persistProjectVideo(videoURI: string) {
  if (nativeModule?.persistProjectVideo) {
    return nativeModule.persistProjectVideo(videoURI);
  }

  if (Platform.OS !== 'ios') {
    return {
      videoUri: videoURI,
    } satisfies PersistVideoResponse;
  }

  return requireNativeMethod('persistProjectVideo')(videoURI);
}

export async function resolveProjectMedia(payload: {
  videoURI?: string;
  videoFileName?: string;
  thumbnailUri?: string;
  thumbnailFileName?: string;
}) {
  if (nativeModule?.resolveProjectMedia) {
    return nativeModule.resolveProjectMedia(payload);
  }

  if (Platform.OS !== 'ios') {
    return {
      videoUri: payload.videoURI,
      videoFileName: payload.videoFileName,
      thumbnailUri: payload.thumbnailUri,
      thumbnailFileName: payload.thumbnailFileName,
    } satisfies ResolveProjectMediaResponse;
  }

  return requireNativeMethod('resolveProjectMedia')(payload);
}

export async function exportProject(payload: {
  videoURI: string;
  subtitles: NativeSubtitleSegment[];
  style: SubtitleStyle;
  resolution: ExportResolution;
}) {
  if (nativeModule?.exportProject) {
    return nativeModule.exportProject(payload);
  }

  if (Platform.OS !== 'ios') {
    return {
      outputUri: payload.videoURI,
    } satisfies ExportResponse;
  }

  return requireNativeMethod('exportProject')(payload);
}

export async function saveVideoToPhotos(videoURI: string) {
  if (nativeModule?.saveVideoToPhotos) {
    return nativeModule.saveVideoToPhotos(videoURI);
  }

  if (Platform.OS !== 'ios') {
    return {
      localIdentifier: videoURI,
    } satisfies SaveResponse;
  }

  return requireNativeMethod('saveVideoToPhotos')(videoURI);
}
