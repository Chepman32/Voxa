jest.mock('../src/store/storage', () => ({
  zustandStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { migratePersistedAppState, useAppStore } from '../src/store/app-store';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project } from '../src/types/models';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    title: 'Stored',
    sourceFileName: 'stored.mov',
    videoLocalURI: 'file:///documents/stored.mov',
    duration: 4200,
    createdAt: 1,
    updatedAt: 1,
    subtitles: [],
    globalStyle: defaultSubtitleStyle,
    waveform: [0.2, 0.4],
    recognitionStatus: 'failed',
    metrics: { width: 1080, height: 1920 },
    ...overrides,
  };
}

describe('app store migration', () => {
  it('drops the legacy global speech locale while preserving stored projects', () => {
    const migrated = migratePersistedAppState({
      hasCompletedOnboarding: true,
      settings: {
        speechLocale: 'ru-RU',
        preferredExportResolution: '4k',
        highlightEditedWords: false,
      } as any,
      projects: [
        makeProject({
          videoLocalURI: 'file:///tmp/stored.mov',
          thumbnailUri:
            'file:///private/var/mobile/Containers/Data/Application/id/tmp/thumb.jpg',
        }),
      ],
    });

    expect(migrated.settings).toEqual({
      preferredExportResolution: '4k',
      highlightEditedWords: false,
      transcriptionLanguageMode: 'ask',
      rememberLastTranscriptionLanguage: false,
      lastTranscriptionLocale: 'ru-RU',
    });
    expect(migrated.settings).not.toHaveProperty('speechLocale');
    expect(migrated.projects).toHaveLength(1);
    expect(migrated.projects[0]).toMatchObject({
      id: 'project-1',
      recognitionMode: 'auto',
      videoFileName: 'stored.mov',
      thumbnailUri: undefined,
      thumbnailFileName: 'thumb.jpg',
    });
    expect(migrated.projects[0]?.subtitles).toHaveLength(1);
    expect(migrated.projects[0]?.subtitles[0]?.isPlaceholder).toBe(true);
  });

  it('preserves ask-before-transcription during migration', () => {
    const migrated = migratePersistedAppState({
      settings: {
        transcriptionLanguageMode: 'ask',
      } as any,
    });

    expect(migrated.settings.transcriptionLanguageMode).toBe('ask');
  });

  it('migrates legacy auto language selection to ask-before-transcription', () => {
    const migrated = migratePersistedAppState({
      settings: {
        transcriptionLanguageMode: 'auto',
      } as any,
    });

    expect(migrated.settings.transcriptionLanguageMode).toBe('ask');
  });

  it('preserves valid folders and clears stale folder references', () => {
    const migrated = migratePersistedAppState({
      folders: [
        {
          id: 'folder-1',
          title: 'Client Clips',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      projects: [
        makeProject({ id: 'project-1', folderId: 'folder-1' }),
        makeProject({ id: 'project-2', folderId: 'missing-folder' }),
      ],
    });

    expect(migrated.folders).toHaveLength(1);
    expect(migrated.projects[0]?.folderId).toBe('folder-1');
    expect(migrated.projects[1]?.folderId).toBeUndefined();
  });
});

describe('app store project folders', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeProjectId: null,
      folders: [],
      projects: [],
      route: 'home',
    });
  });

  it('moves removed projects to trash before permanent deletion', () => {
    useAppStore.getState().addProject(makeProject());

    useAppStore.getState().moveProjectToTrash('project-1');

    expect(useAppStore.getState().projects[0]?.deletedAt).toEqual(
      expect.any(Number),
    );

    useAppStore.getState().recoverProject('project-1');

    expect(useAppStore.getState().projects[0]?.deletedAt).toBeUndefined();

    useAppStore.getState().moveProjectToTrash('project-1');
    useAppStore.getState().deleteProject('project-1');

    expect(useAppStore.getState().projects).toHaveLength(0);
  });

  it('removes folders without deleting their projects', () => {
    const folderId = useAppStore.getState().createFolder('Client Clips');
    useAppStore.getState().addProject(makeProject({ folderId }));

    useAppStore.getState().removeFolder(folderId);

    expect(useAppStore.getState().folders).toHaveLength(0);
    expect(useAppStore.getState().projects).toHaveLength(1);
    expect(useAppStore.getState().projects[0]?.folderId).toBeUndefined();
  });
});
