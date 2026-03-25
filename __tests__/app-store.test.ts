jest.mock('../src/store/storage', () => ({
  zustandStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { migratePersistedAppState } from '../src/store/app-store';
import { defaultSubtitleStyle } from '../src/theme/tokens';

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
        {
          id: 'project-1',
          title: 'Stored',
          sourceFileName: 'stored.mov',
          videoLocalURI: 'file:///tmp/stored.mov',
          duration: 4200,
          createdAt: 1,
          updatedAt: 1,
          subtitles: [],
          globalStyle: defaultSubtitleStyle,
          waveform: [0.2, 0.4],
          recognitionStatus: 'failed',
          metrics: { width: 1080, height: 1920 },
        },
      ],
    });

    expect(migrated.settings).toEqual({
      preferredExportResolution: '4k',
      highlightEditedWords: false,
    });
    expect(migrated.settings).not.toHaveProperty('speechLocale');
    expect(migrated.projects).toHaveLength(1);
    expect(migrated.projects[0]).toMatchObject({
      id: 'project-1',
      recognitionMode: 'auto',
    });
    expect(migrated.projects[0]?.subtitles).toHaveLength(1);
    expect(migrated.projects[0]?.subtitles[0]?.isPlaceholder).toBe(true);
  });
});
