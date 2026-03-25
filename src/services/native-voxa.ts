import { NativeModules, Platform } from 'react-native';

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
  thumbnailUri?: string;
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

interface VoxaNativeModule {
  requestAuthorizations(): Promise<PermissionSummary>;
  getSpeechAuthorizationStatus(): Promise<PermissionSummary['speech']>;
  requestSpeechAuthorization(): Promise<PermissionSummary['speech']>;
  getAvailableSpeechLocales(): Promise<SpeechLocaleOption[]>;
  prepareProject(
    videoURI: string,
    localeOverride: string | null,
  ): Promise<PrepareProjectResponse>;
  exportProject(payload: {
    videoURI: string;
    subtitles: NativeSubtitleSegment[];
    style: SubtitleStyle;
    resolution: ExportResolution;
  }): Promise<ExportResponse>;
  saveVideoToPhotos(videoURI: string): Promise<SaveResponse>;
}

const nativeModule = NativeModules.VoxaOfflineModule as VoxaNativeModule | undefined;

function requireNativeMethod<K extends keyof VoxaNativeModule>(methodName: K) {
  if (!nativeModule?.[methodName]) {
    throw new Error(`VoxaOfflineModule.${String(methodName)} is unavailable.`);
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
  if (Platform.OS !== 'ios') {
    return 'authorized' satisfies PermissionSummary['speech'];
  }

  return requireNativeMethod('getSpeechAuthorizationStatus')();
}

export async function requestSpeechAuthorization() {
  if (Platform.OS !== 'ios') {
    return 'authorized' satisfies PermissionSummary['speech'];
  }

  return requireNativeMethod('requestSpeechAuthorization')();
}

export async function getAvailableSpeechLocales() {
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
) {
  if (Platform.OS !== 'ios') {
    return {
      duration: fallbackDuration,
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

  return requireNativeMethod('prepareProject')(videoURI, localeOverride);
}

export async function exportProject(payload: {
  videoURI: string;
  subtitles: NativeSubtitleSegment[];
  style: SubtitleStyle;
  resolution: ExportResolution;
}) {
  if (Platform.OS !== 'ios') {
    return {
      outputUri: payload.videoURI,
    } satisfies ExportResponse;
  }

  return requireNativeMethod('exportProject')(payload);
}

export async function saveVideoToPhotos(videoURI: string) {
  if (Platform.OS !== 'ios') {
    return {
      localIdentifier: videoURI,
    } satisfies SaveResponse;
  }

  return requireNativeMethod('saveVideoToPhotos')(videoURI);
}
