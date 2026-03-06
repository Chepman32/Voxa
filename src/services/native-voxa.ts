import { NativeModules, Platform } from 'react-native';

import { createId } from '../lib/id';
import type { ExportResolution, PermissionSummary, SubtitleStyle } from '../types/models';

export interface NativeSubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
}

interface PrepareProjectResponse {
  duration: number;
  thumbnailUri?: string;
  width: number;
  height: number;
  waveform: number[];
  subtitles: NativeSubtitleSegment[];
  recognitionStatus: 'ready' | 'manual' | 'failed';
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
  prepareProject(videoURI: string, locale: string): Promise<PrepareProjectResponse>;
  exportProject(payload: {
    videoURI: string;
    subtitles: NativeSubtitleSegment[];
    style: SubtitleStyle;
    resolution: ExportResolution;
  }): Promise<ExportResponse>;
  saveVideoToPhotos(videoURI: string): Promise<SaveResponse>;
}

const nativeModule = NativeModules.VoxaOfflineModule as VoxaNativeModule | undefined;

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
      confidence: 0.95,
    };
  });
}

export async function requestAuthorizations() {
  if (Platform.OS !== 'ios' || !nativeModule?.requestAuthorizations) {
    return {
      photoLibrary: 'granted',
      photoAddOnly: 'granted',
      speech: 'granted',
    } satisfies PermissionSummary;
  }

  return nativeModule.requestAuthorizations();
}

export async function prepareProject(videoURI: string, locale: string, fallbackDuration = 12000) {
  if (Platform.OS !== 'ios' || !nativeModule?.prepareProject) {
    return {
      duration: fallbackDuration,
      width: 1080,
      height: 1920,
      waveform: createMockWaveform(),
      subtitles: createMockSubtitles(fallbackDuration),
      recognitionStatus: 'manual',
    } satisfies PrepareProjectResponse;
  }

  return nativeModule.prepareProject(videoURI, locale);
}

export async function exportProject(payload: {
  videoURI: string;
  subtitles: NativeSubtitleSegment[];
  style: SubtitleStyle;
  resolution: ExportResolution;
}) {
  if (Platform.OS !== 'ios' || !nativeModule?.exportProject) {
    return {
      outputUri: payload.videoURI,
    } satisfies ExportResponse;
  }

  return nativeModule.exportProject(payload);
}

export async function saveVideoToPhotos(videoURI: string) {
  if (Platform.OS !== 'ios' || !nativeModule?.saveVideoToPhotos) {
    return {
      localIdentifier: videoURI,
    } satisfies SaveResponse;
  }

  return nativeModule.saveVideoToPhotos(videoURI);
}
