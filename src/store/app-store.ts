import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSubtitleStyle } from '../theme/tokens';
import type {
  AppRoute,
  OnboardingAnswers,
  ProcessingState,
  Project,
  ProjectFolder,
  SupportedLocale,
  UserSettings,
} from '../types/models';
import { createId } from '../lib/id';
import { ensureSubtitles, normalizeSubtitleStyle } from '../lib/project';
import { zustandStorage } from './storage';

interface AppState {
  hydrated: boolean;
  route: AppRoute;
  activeProjectId: string | null;
  hasCompletedOnboarding: boolean;
  onboardingStep: number;
  onboardingAnswers: OnboardingAnswers;
  uiLocale: SupportedLocale | null;
  processing: ProcessingState;
  settings: UserSettings;
  projects: Project[];
  folders: ProjectFolder[];
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
  setProcessingPhase: (
    phase: ProcessingState['phase'],
    label: string,
    progress?: number | null,
  ) => void;
  finishProcessing: () => void;
  setPreferredExportResolution: (
    resolution: UserSettings['preferredExportResolution'],
  ) => void;
  setHighlightEditedWords: (value: boolean) => void;
  setShowFolderItemCounts: (value: boolean) => void;
  setTranscriptionLanguageMode: (
    mode: UserSettings['transcriptionLanguageMode'],
  ) => void;
  setRememberLastTranscriptionLanguage: (value: boolean) => void;
  setLastTranscriptionLocale: (locale: string | null) => void;
  addProject: (project: Project) => void;
  upsertProject: (project: Project) => void;
  replaceProject: (project: Project) => void;
  renameProject: (projectId: string, title: string) => void;
  duplicateProject: (projectId: string) => void;
  moveProjectToFolder: (projectId: string, folderId: string) => void;
  moveProjectToTrash: (projectId: string) => void;
  recoverProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  createFolder: (title: string) => string;
  renameFolder: (folderId: string, title: string) => void;
  removeFolder: (folderId: string) => void;
  emptyTrash: () => void;
}

type PersistedAppState = Partial<
  Pick<
    AppState,
    | 'hasCompletedOnboarding'
    | 'onboardingStep'
    | 'onboardingAnswers'
    | 'uiLocale'
    | 'projects'
    | 'folders'
    | 'settings'
  >
>;

const defaultSettings: UserSettings = {
  preferredExportResolution: '1080p',
  highlightEditedWords: true,
  showFolderItemCounts: false,
  transcriptionLanguageMode: 'ask',
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
  return (
    normalizedUri.includes('/tmp/') ||
    normalizedUri.includes('/temporaryitems/')
  );
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

function normalizeFolderTitle(title: string) {
  const trimmedTitle = title.trim();
  return trimmedTitle.length > 0 ? trimmedTitle : 'Untitled Folder';
}

function normalizeStoredFolder(folder: ProjectFolder): ProjectFolder {
  const now = Date.now();

  return {
    ...folder,
    title: normalizeFolderTitle(folder.title ?? ''),
    createdAt: typeof folder.createdAt === 'number' ? folder.createdAt : now,
    updatedAt: typeof folder.updatedAt === 'number' ? folder.updatedAt : now,
  };
}

function normalizeStoredProject(project: Project): Project {
  const subtitles = ensureSubtitles(
    project.subtitles ?? [],
    project.duration ?? 0,
  );
  const hasSelectedSubtitle = subtitles.some(
    subtitle => subtitle.id === project.lastEditedSubtitleId,
  );

  return {
    ...project,
    folderId:
      typeof project.folderId === 'string' ? project.folderId : undefined,
    deletedAt:
      typeof project.deletedAt === 'number' ? project.deletedAt : undefined,
    globalStyle: normalizeSubtitleStyle(
      project.globalStyle ?? defaultSubtitleStyle,
    ),
    videoFileName:
      project.videoFileName ?? getFileNameFromUri(project.videoLocalURI),
    thumbnailUri: isTemporaryFileUri(project.thumbnailUri)
      ? undefined
      : project.thumbnailUri,
    thumbnailFileName:
      project.thumbnailFileName ?? getFileNameFromUri(project.thumbnailUri),
    subtitles,
    recognitionMode: project.recognitionMode ?? 'auto',
    lastEditedSubtitleId: hasSelectedSubtitle
      ? project.lastEditedSubtitleId
      : undefined,
  };
}

function copyProjectForDuplicate(project: Project): Project {
  const now = Date.now();

  return normalizeStoredProject({
    ...project,
    id: createId('project'),
    title: `${project.title} Copy`,
    createdAt: now,
    updatedAt: now,
    deletedAt: undefined,
    subtitles: project.subtitles.map(subtitle => ({
      ...subtitle,
      words: subtitle.words?.map(word => ({ ...word })),
    })),
    globalStyle: { ...project.globalStyle },
    waveform: [...project.waveform],
    metrics: { ...project.metrics },
  });
}

function normalizeTranscriptionLanguageMode(
  _mode?: string,
): UserSettings['transcriptionLanguageMode'] {
  return defaultSettings.transcriptionLanguageMode;
}

export function migratePersistedAppState(
  persistedState?: PersistedAppState | null,
) {
  const state = (persistedState ?? {}) as PersistedAppState & {
    settings?: Partial<UserSettings> & { speechLocale?: string };
  };
  const folders = (state.folders ?? []).map(normalizeStoredFolder);
  const folderIds = new Set(folders.map(folder => folder.id));
  const projects = (state.projects ?? [])
    .map(normalizeStoredProject)
    .map(project => {
      if (!project.folderId || folderIds.has(project.folderId)) {
        return project;
      }

      return {
        ...project,
        folderId: undefined,
      };
    });

  return {
    ...state,
    settings: {
      preferredExportResolution:
        state.settings?.preferredExportResolution ??
        defaultSettings.preferredExportResolution,
      highlightEditedWords:
        state.settings?.highlightEditedWords ??
        defaultSettings.highlightEditedWords,
      showFolderItemCounts:
        state.settings?.showFolderItemCounts ??
        defaultSettings.showFolderItemCounts,
      transcriptionLanguageMode: normalizeTranscriptionLanguageMode(
        state.settings?.transcriptionLanguageMode,
      ),
      rememberLastTranscriptionLanguage:
        state.settings?.rememberLastTranscriptionLanguage ??
        defaultSettings.rememberLastTranscriptionLanguage,
      lastTranscriptionLocale:
        state.settings?.lastTranscriptionLocale ??
        state.settings?.speechLocale ??
        null,
    },
    folders,
    projects,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      hydrated: false,
      route: 'home',
      activeProjectId: null,
      hasCompletedOnboarding: false,
      onboardingStep: 0,
      onboardingAnswers: defaultOnboardingAnswers,
      uiLocale: null,
      processing: defaultProcessing,
      settings: defaultSettings,
      projects: [],
      folders: [],
      setHydrated: value => set({ hydrated: value }),
      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true, onboardingStep: 0 }),
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
      openSettings: () => set({ route: 'settings' }),
      closeSettings: () => set({ route: 'home' }),
      openProject: projectId =>
        set({ activeProjectId: projectId, route: 'editor' }),
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
      setProcessingPhase: (phase, label, progress) =>
        set(state => ({
          processing: {
            ...state.processing,
            visible: true,
            phase,
            label,
            progress,
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
      setShowFolderItemCounts: showFolderItemCounts =>
        set(state => ({
          settings: { ...state.settings, showFolderItemCounts },
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
          projects: [
            normalizeStoredProject({
              ...project,
              deletedAt: undefined,
            }),
            ...state.projects,
          ],
        })),
      upsertProject: project =>
        set(state => {
          const nextProject = {
            ...normalizeStoredProject(project),
            updatedAt: Date.now(),
          };
          const existingIndex = state.projects.findIndex(
            item => item.id === project.id,
          );
          if (existingIndex === -1) {
            return { projects: [nextProject, ...state.projects] };
          }
          const nextProjects = [...state.projects];
          nextProjects[existingIndex] = nextProject;
          return { projects: nextProjects };
        }),
      replaceProject: project =>
        set(state => {
          const existingIndex = state.projects.findIndex(
            item => item.id === project.id,
          );
          if (existingIndex === -1) {
            return {
              projects: [normalizeStoredProject(project), ...state.projects],
            };
          }

          const nextProjects = [...state.projects];
          nextProjects[existingIndex] = normalizeStoredProject(project);
          return { projects: nextProjects };
        }),
      renameProject: (projectId, title) =>
        set(state => {
          const nextTitle = title.trim();
          if (nextTitle.length === 0) {
            return {};
          }

          return {
            projects: state.projects.map(project =>
              project.id === projectId
                ? { ...project, title: nextTitle, updatedAt: Date.now() }
                : project,
            ),
          };
        }),
      duplicateProject: projectId =>
        set(state => {
          const project = state.projects.find(item => item.id === projectId);
          if (!project || project.deletedAt) {
            return {};
          }

          return {
            projects: [copyProjectForDuplicate(project), ...state.projects],
          };
        }),
      moveProjectToFolder: (projectId, folderId) =>
        set(state => {
          const folderExists = state.folders.some(
            folder => folder.id === folderId,
          );
          if (!folderExists) {
            return {};
          }

          return {
            projects: state.projects.map(project =>
              project.id === projectId && !project.deletedAt
                ? { ...project, folderId, updatedAt: Date.now() }
                : project,
            ),
          };
        }),
      moveProjectToTrash: projectId =>
        set(state => ({
          activeProjectId:
            state.activeProjectId === projectId ? null : state.activeProjectId,
          route:
            state.activeProjectId === projectId && state.route === 'editor'
              ? 'home'
              : state.route,
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                  ...project,
                  deletedAt: project.deletedAt ?? Date.now(),
                  updatedAt: Date.now(),
                }
              : project,
          ),
        })),
      recoverProject: projectId =>
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, deletedAt: undefined, updatedAt: Date.now() }
              : project,
          ),
        })),
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
      createFolder: title => {
        const now = Date.now();
        const folder: ProjectFolder = {
          id: createId('folder'),
          title: normalizeFolderTitle(title),
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          folders: [folder, ...state.folders],
        }));

        return folder.id;
      },
      renameFolder: (folderId, title) =>
        set(state => {
          const nextTitle = title.trim();
          if (nextTitle.length === 0) {
            return {};
          }

          return {
            folders: state.folders.map(folder =>
              folder.id === folderId
                ? { ...folder, title: nextTitle, updatedAt: Date.now() }
                : folder,
            ),
          };
        }),
      removeFolder: folderId =>
        set(state => ({
          folders: state.folders.filter(folder => folder.id !== folderId),
          projects: state.projects.map(project =>
            project.folderId === folderId
              ? { ...project, folderId: undefined, updatedAt: Date.now() }
              : project,
          ),
        })),
      emptyTrash: () =>
        set(state => ({
          projects: state.projects.filter(project => !project.deletedAt),
        })),
    }),
    {
      name: 'localsub-app-state',
      storage: createJSONStorage(() => zustandStorage),
      partialize: state => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        onboardingStep: state.onboardingStep,
        onboardingAnswers: state.onboardingAnswers,
        uiLocale: state.uiLocale,
        settings: state.settings,
        projects: state.projects,
        folders: state.folders,
      }),
      migrate: persistedState =>
        migratePersistedAppState(persistedState as PersistedAppState),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
      version: 11,
    },
  ),
);

export function getActiveProject() {
  const state = useAppStore.getState();
  return (
    state.projects.find(project => project.id === state.activeProjectId) ?? null
  );
}
