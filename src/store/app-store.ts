import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSubtitleStyle } from '../theme/tokens';
import type {
  AppRoute,
  ProcessingState,
  Project,
  UserSettings,
} from '../types/models';
import { ensureSubtitles } from '../lib/project';
import { zustandStorage } from './storage';

interface AppState {
  hydrated: boolean;
  route: AppRoute;
  activeProjectId: string | null;
  settingsOpen: boolean;
  hasCompletedOnboarding: boolean;
  processing: ProcessingState;
  settings: UserSettings;
  projects: Project[];
  setHydrated: (value: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openProject: (projectId: string) => void;
  closeProject: () => void;
  beginProcessing: (assetUri?: string) => void;
  setProcessingPhase: (phase: ProcessingState['phase'], label: string) => void;
  finishProcessing: () => void;
  setSpeechLocale: (locale: string) => void;
  setPreferredExportResolution: (resolution: UserSettings['preferredExportResolution']) => void;
  addProject: (project: Project) => void;
  upsertProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
}

const defaultSettings: UserSettings = {
  speechLocale: 'en-US',
  preferredExportResolution: '1080p',
};

const defaultProcessing: ProcessingState = {
  visible: false,
  phase: 'extracting',
  label: 'Extracting audio...',
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      hydrated: false,
      route: 'home',
      activeProjectId: null,
      settingsOpen: false,
      hasCompletedOnboarding: false,
      processing: defaultProcessing,
      settings: defaultSettings,
      projects: [],
      setHydrated: value => set({ hydrated: value }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
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
      setSpeechLocale: speechLocale =>
        set(state => ({
          settings: { ...state.settings, speechLocale },
        })),
      setPreferredExportResolution: preferredExportResolution =>
        set(state => ({
          settings: { ...state.settings, preferredExportResolution },
        })),
      addProject: project =>
        set(state => ({
          projects: [project, ...state.projects],
        })),
      upsertProject: project =>
        set(state => {
          const nextProject = {
            ...project,
            globalStyle: project.globalStyle ?? defaultSubtitleStyle,
            subtitles: ensureSubtitles(project.subtitles, project.duration),
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
        settings: state.settings,
        projects: state.projects,
      }),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
      version: 1,
    },
  ),
);

export function getActiveProject() {
  const state = useAppStore.getState();
  return state.projects.find(project => project.id === state.activeProjectId) ?? null;
}
