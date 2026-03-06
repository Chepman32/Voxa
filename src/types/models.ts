export type SubtitlePosition = 'top' | 'middle' | 'bottom';
export type SubtitleCasing = 'sentence' | 'uppercase';
export type RecognitionStatus = 'ready' | 'manual' | 'failed';
export type ExportResolution = '720p' | '1080p' | '4k';
export type AppRoute = 'home' | 'editor';

export interface SubtitleStyle {
  fontPresetId: string;
  fontFamily: string;
  fontWeight: '500' | '600' | '700' | '800';
  fontSize: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  position: SubtitlePosition;
  casing: SubtitleCasing;
}

export interface SubtitleBlock {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence?: number;
  isGenerated?: boolean;
  isPlaceholder?: boolean;
}

export interface ProjectMetrics {
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  sourceFileName: string;
  videoLocalURI: string;
  thumbnailUri?: string;
  duration: number;
  createdAt: number;
  updatedAt: number;
  subtitles: SubtitleBlock[];
  globalStyle: SubtitleStyle;
  waveform: number[];
  recognitionStatus: RecognitionStatus;
  importError?: string;
  metrics: ProjectMetrics;
  lastEditedSubtitleId?: string;
}

export interface ProcessingState {
  visible: boolean;
  phase: 'extracting' | 'recognizing' | 'composing';
  label: string;
  assetUri?: string;
}

export interface UserSettings {
  speechLocale: string;
  preferredExportResolution: ExportResolution;
}

export interface PermissionSummary {
  photoLibrary: string;
  photoAddOnly: string;
  speech: string;
}
