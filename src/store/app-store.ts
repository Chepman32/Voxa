import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSubtitleStyle } from '../theme/tokens';
import type {
  AppRoute,
  OnboardingAnswers,
  ProcessingState,
  Project,
  SupportedLocale,
  UserSettings,
} from '../types/models';
import { ensureSubtitles, normalizeSubtitleStyle } from '../lib/project';
import { zustandStorage } from './storage';

interface AppState {
  hydrated: boolean;
  route: AppRoute;
  activeProjectId: string | null;
  settingsOpen: boolean;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  onboardingAnswers: OnboardingAnswers;
  uiLocale: SupportedLocale | null;
  processing: ProcessingState;
  settings: UserSettings;
  projects: Project[];
  setHydrated: (value: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  setOnboardingAnswers: (answers: Partial<OnboardingAnswers>) => void;
  setUiLocale: (locale: SupportedLocale) => void;
  openSettings: () => void;
  closeSettings: () => void;
  openProject: (projectId: string) => void;
  closeProject: () => void;
  beginProcessing: (assetUri?: string) => void;
  setProcessingPhase: (phase: ProcessingState['phase'], label: string) => void;
  finishProcessing: () => void;
  setPreferredExportResolution: (resolution: UserSettings['preferredExportResolution']) => void;
  setHighlightEditedWords: (value: boolean) => void;
  setTranscriptionLanguageMode: (mode: UserSettings['transcriptionLanguageMode']) => void;
  setRememberLastTranscriptionLanguage: (value: boolean) => void;
  setLastTranscriptionLocale: (locale: string | null) => void;
  addProject: (project: Project) => void;
  upsertProject: (project: Project) => void;
  replaceProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
}

type PersistedAppState = Partial<
  Pick<AppState, 'hasCompletedOnboarding' | 'onboardingStep' | 'onboardingAnswers' | 'uiLocale' | 'projects' | 'settings'>
>;

const defaultSettings: UserSettings = {
  preferredExportResolution: '1080p',
  highlightEditedWords: true,
  transcriptionLanguageMode: 'app',
  rememberLastTranscriptionLanguage: false,
  lastTranscriptionLocale: null,
};

const defaultProcessing: ProcessingState = {
  visible: false,
  phase: 'extracting',
  label: 'Extracting audio...',
};

const defaultOnboardingAnswers: OnboardingAnswers = {
  goal: null,
  painPoints: [],
  preferences: {
    stylePreset: null,
    fontPreset: null,
    effect: null,
  },
};

function isTemporaryFileUri(uri?: string) {
  if (!uri?.startsWith('file://')) {
    return false;
  }

  const normalizedUri = uri.toLowerCase();
  return normalizedUri.includes('/tmp/') || normalizedUri.includes('/temporaryitems/');
}

function getFileNameFromUri(uri?: string) {
  if (!uri?.startsWith('file://')) {
    return undefined;
  }

  const path = decodeURIComponent(uri.replace(/^file:\/\//, ''));
  const pathParts = path.split('/').filter(Boolean);
  const fileName = pathParts[pathParts.length - 1];
  return fileName || undefined;
}

function normalizeStoredProject(project: Project): Project {
  const subtitles = ensureSubtitles(project.subtitles ?? [], project.duration ?? 0);
  const hasSelectedSubtitle = subtitles.some(
    subtitle => subtitle.id === project.lastEditedSubtitleId,
  );

  return {
    ...project,
    globalStyle: normalizeSubtitleStyle(project.globalStyle ?? defaultSubtitleStyle),
    videoFileName: project.videoFileName ?? getFileNameFromUri(project.videoLocalURI),
    thumbnailUri: isTemporaryFileUri(project.thumbnailUri)
      ? undefined
      : project.thumbnailUri,
    thumbnailFileName:
      project.thumbnailFileName ?? getFileNameFromUri(project.thumbnailUri),
    subtitles,
    recognitionMode: project.recognitionMode ?? 'auto',
    lastEditedSubtitleId: hasSelectedSubtitle ? project.lastEditedSubtitleId : undefined,
  };
}

export function migratePersistedAppState(persistedState?: PersistedAppState | null) {
  const state = (persistedState ?? {}) as PersistedAppState & {
    settings?: Partial<UserSettings> & { speechLocale?: string };
  };

  return {
    ...state,
    settings: {
      preferredExportResolution:
        state.settings?.preferredExportResolution ??
        defaultSettings.preferredExportResolution,
      highlightEditedWords:
        state.settings?.highlightEditedWords ?? defaultSettings.highlightEditedWords,
      transcriptionLanguageMode:
        state.settings?.transcriptionLanguageMode ??
        defaultSettings.transcriptionLanguageMode,
      rememberLastTranscriptionLanguage:
        state.settings?.rememberLastTranscriptionLanguage ??
        defaultSettings.rememberLastTranscriptionLanguage,
      lastTranscriptionLocale:
        state.settings?.lastTranscriptionLocale ?? state.settings?.speechLocale ?? null,
    },
    projects: (state.projects ?? []).map(normalizeStoredProject),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      hydrated: false,
      route: 'home',
      activeProjectId: null,
      settingsOpen: false,
      hasCompletedOnboarding: false,
      onboardingStep: 0,
      onboardingAnswers: defaultOnboardingAnswers,
      uiLocale: null,
      processing: defaultProcessing,
      settings: defaultSettings,
      projects: [],
      setHydrated: value => set({ hydrated: value }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true, onboardingStep: 0 }),
      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          onboardingStep: 0,
          onboardingAnswers: defaultOnboardingAnswers,
        }),
      setOnboardingStep: step => set({ onboardingStep: step }),
      setOnboardingAnswers: answers =>
        set(state => ({
          onboardingAnswers: { ...state.onboardingAnswers, ...answers },
        })),
      setUiLocale: locale => set({ uiLocale: locale }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      openProject: projectId => set({ activeProjectId: projectId, route: 'editor' }),
      closeProject: () => set({ activeProjectId: null, route: 'home' }),
      beginProcessing: assetUri =>
        set({
          processing: {
            visible: true,
            phase: 'extracting',
            label: 'Extracting audio...',
            assetUri,
          },
        }),
      setProcessingPhase: (phase, label) =>
        set(state => ({
          processing: {
            ...state.processing,
            visible: true,
            phase,
            label,
          },
        })),
      finishProcessing: () => set({ processing: defaultProcessing }),
      setPreferredExportResolution: preferredExportResolution =>
        set(state => ({
          settings: { ...state.settings, preferredExportResolution },
        })),
      setHighlightEditedWords: highlightEditedWords =>
        set(state => ({
          settings: { ...state.settings, highlightEditedWords },
        })),
      setTranscriptionLanguageMode: transcriptionLanguageMode =>
        set(state => ({
          settings: { ...state.settings, transcriptionLanguageMode },
        })),
      setRememberLastTranscriptionLanguage: rememberLastTranscriptionLanguage =>
        set(state => ({
          settings: { ...state.settings, rememberLastTranscriptionLanguage },
        })),
      setLastTranscriptionLocale: lastTranscriptionLocale =>
        set(state => ({
          settings: { ...state.settings, lastTranscriptionLocale },
        })),
      addProject: project =>
        set(state => ({
          projects: [normalizeStoredProject(project), ...state.projects],
        })),
      upsertProject: project =>
        set(state => {
          const nextProject = {
            ...normalizeStoredProject(project),
            updatedAt: Date.now(),
          };
          const existingIndex = state.projects.findIndex(item => item.id === project.id);
          if (existingIndex === -1) {
            return { projects: [nextProject, ...state.projects] };
          }
          const nextProjects = [...state.projects];
          nextProjects[existingIndex] = nextProject;
          return { projects: nextProjects };
        }),
      replaceProject: project =>
        set(state => {
          const existingIndex = state.projects.findIndex(item => item.id === project.id);
          if (existingIndex === -1) {
            return { projects: [normalizeStoredProject(project), ...state.projects] };
          }

          const nextProjects = [...state.projects];
          nextProjects[existingIndex] = normalizeStoredProject(project);
          return { projects: nextProjects };
        }),
      deleteProject: projectId =>
        set(state => ({
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
          route:
            state.activeProjectId === projectId && state.route === 'editor'
              ? 'home'
              : state.route,
          projects: state.projects.filter(project => project.id !== projectId),
        })),
    }),
    {
      name: 'voxa-app-state',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingStep: state.onboardingStep,
        onboardingAnswers: state.onboardingAnswers,
        uiLocale: state.uiLocale,
        settings: state.settings,
        projects: state.projects,
      }),
      migrate: persistedState => migratePersistedAppState(persistedState as PersistedAppState),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
      version: 8,
    },
  ),
);

export function getActiveProject() {
  const state = useAppStore.getState();
  return state.projects.find(project => project.id === state.activeProjectId) ?? null;
}
