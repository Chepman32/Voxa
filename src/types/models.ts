export type SubtitlePosition = 'top' | 'middle' | 'bottom';
export type SubtitleCasing = 'sentence' | 'uppercase';
export type SubtitleEffect = 'none' | 'neon' | 'chrome' | 'glow' | 'shadow';
export type RecognitionStatus = 'ready' | 'manual' | 'failed';
export type RecognitionMode = 'auto' | 'manual';
export type ExportResolution = '720p' | '1080p' | '4k';
export type TranscriptionLanguageMode = 'auto' | 'ask';
export type AppRoute = 'home' | 'editor' | 'settings';

export interface SpeechLocaleOption {
  label: string;
  value: string;
}

export interface SubtitleStyle {
  fontPresetId: string;
  fontFamily: string;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  fontSize: number;
  letterSpacing: number;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  wordHighlightEnabled: boolean;
  position: SubtitlePosition;
  positionOffsetYRatio: number;
  casing: SubtitleCasing;
  effect?: SubtitleEffect;
}

export interface SubtitleWord {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface SubtitleBlock {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words?: SubtitleWord[];
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
  videoFileName?: string;
  thumbnailUri?: string;
  thumbnailFileName?: string;
  duration: number;
  createdAt: number;
  updatedAt: number;
  subtitles: SubtitleBlock[];
  globalStyle: SubtitleStyle;
  waveform: number[];
  recognitionStatus: RecognitionStatus;
  recognitionLocale?: string;
  recognitionMode?: RecognitionMode;
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
  preferredExportResolution: ExportResolution;
  highlightEditedWords: boolean;
  transcriptionLanguageMode: TranscriptionLanguageMode;
  rememberLastTranscriptionLanguage: boolean;
  lastTranscriptionLocale: string | null;
}

export interface PermissionSummary {
  photoLibrary: string;
  photoAddOnly: string;
  speech: string;
}

export interface OnboardingPreferences {
  stylePreset: string | null;
  fontPreset: string | null;
  effect: string | null;
}

export type SupportedLocale =
  | 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar';

export interface OnboardingAnswers {
  goal: string | null;
  painPoints: string[];
  preferences: OnboardingPreferences;
}
