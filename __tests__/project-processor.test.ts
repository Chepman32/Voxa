import type { Asset } from 'react-native-image-picker';

jest.mock('../src/services/native-voxa', () => ({
  prepareProject: jest.fn(),
}));

import {
  buildProjectFromAsset,
  retryProjectSubtitles,
} from '../src/services/project-processor';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project } from '../src/types/models';

const mockPrepareProject = jest.mocked(
  require('../src/services/native-voxa').prepareProject,
);

describe('project processor', () => {
  const asset: Asset = {
    uri: '/tmp/detect-language.mov',
    fileName: 'detect-language.mov',
    duration: 12,
  };

  afterEach(() => {
    mockPrepareProject.mockReset();
  });

  it('builds a project with the detected recognition locale', async () => {
    mockPrepareProject.mockResolvedValue({
      duration: 12000,
      thumbnailUri: 'file:///tmp/thumb.jpg',
      width: 1080,
      height: 1920,
      waveform: [0.2, 0.5],
      subtitles: [
        {
          id: 'seg-1',
          startTime: 0,
          endTime: 620,
          text: 'hello',
          words: [{ text: 'hello', startTime: 0, endTime: 620, confidence: 0.92 }],
          confidence: 0.92,
        },
      ],
      transcriptTimeOffsetMs: 0,
      recognitionStatus: 'ready',
      recognitionLocale: 'en-US',
      recognitionMode: 'auto',
      errorMessage: undefined,
    });

    const project = await buildProjectFromAsset(asset);

    expect(mockPrepareProject).toHaveBeenCalledWith(
      'file:///tmp/detect-language.mov',
      null,
      12000,
    );
    expect(project.recognitionStatus).toBe('ready');
    expect(project.recognitionLocale).toBe('en-US');
    expect(project.recognitionMode).toBe('auto');
    expect(project.subtitles[0]).toMatchObject({
      text: 'hello',
      startTime: 0,
      endTime: 620,
    });
  });

  it('keeps a failed project editable when auto detection does not produce subtitles', async () => {
    mockPrepareProject.mockResolvedValue({
      duration: 12000,
      thumbnailUri: 'file:///tmp/thumb.jpg',
      width: 1080,
      height: 1920,
      waveform: [0.2, 0.5],
      subtitles: [],
      transcriptTimeOffsetMs: 0,
      recognitionStatus: 'failed',
      recognitionLocale: undefined,
      recognitionMode: 'auto',
      errorMessage: 'No supported on-device speech locale could transcribe this video.',
    });

    const project = await buildProjectFromAsset(asset);

    expect(project.recognitionStatus).toBe('failed');
    expect(project.recognitionMode).toBe('auto');
    expect(project.importError).toBe(
      'No supported on-device speech locale could transcribe this video.',
    );
    expect(project.subtitles).toHaveLength(1);
    expect(project.subtitles[0]?.isPlaceholder).toBe(true);
  });

  it('retries subtitle generation for an existing failed project with a manual locale', async () => {
    mockPrepareProject.mockResolvedValue({
      duration: 12000,
      thumbnailUri: 'file:///tmp/retry-thumb.jpg',
      width: 1080,
      height: 1920,
      waveform: [0.3, 0.6],
      subtitles: [
        {
          id: 'seg-ru-1',
          startTime: 0,
          endTime: 780,
          text: 'privet',
          words: [{ text: 'privet', startTime: 0, endTime: 780, confidence: 0.88 }],
          confidence: 0.88,
        },
      ],
      transcriptTimeOffsetMs: 0,
      recognitionStatus: 'ready',
      recognitionLocale: 'ru-RU',
      recognitionMode: 'manual',
      errorMessage: undefined,
    });

    const existingProject: Project = {
      id: 'project-1',
      title: 'Detect Language',
      sourceFileName: 'detect-language.mov',
      videoLocalURI: 'file:///tmp/detect-language.mov',
      thumbnailUri: 'file:///tmp/old-thumb.jpg',
      duration: 12000,
      createdAt: 1,
      updatedAt: 1,
      subtitles: [
        {
          id: 'subtitle-placeholder',
          startTime: 0,
          endTime: 2200,
          text: 'Tap to add your first subtitle.',
          isPlaceholder: true,
        },
      ],
      globalStyle: defaultSubtitleStyle,
      waveform: [0.1, 0.2],
      recognitionStatus: 'failed',
      recognitionMode: 'auto',
      importError: 'No supported locale found.',
      metrics: { width: 1080, height: 1920 },
    };

    const project = await retryProjectSubtitles(existingProject, 'ru-RU');

    expect(mockPrepareProject).toHaveBeenCalledWith(
      'file:///tmp/detect-language.mov',
      'ru-RU',
      12000,
    );
    expect(project.id).toBe(existingProject.id);
    expect(project.createdAt).toBe(existingProject.createdAt);
    expect(project.globalStyle).toEqual(existingProject.globalStyle);
    expect(project.recognitionStatus).toBe('ready');
    expect(project.recognitionLocale).toBe('ru-RU');
    expect(project.recognitionMode).toBe('manual');
    expect(project.importError).toBeUndefined();
    expect(project.subtitles[0]).toMatchObject({
      text: 'privet',
      startTime: 0,
    });
  });
});
