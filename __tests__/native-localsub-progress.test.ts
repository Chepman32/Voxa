jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    addListener: jest.fn(),
  },
  NativeModules: {
    LocalSubOfflineModule: {
      prepareProject: jest.fn(),
    },
  },
  Platform: { OS: 'android' },
}));

import {
  SPEECH_MODEL_DOWNLOAD_EVENT,
  prepareProject,
} from '../src/services/native-localsub';

const mockRemoveProgressListener = jest.fn();
const mockAddProgressListener = jest.mocked(
  require('react-native').DeviceEventEmitter.addListener,
);
const mockNativePrepareProject = jest.mocked(
  require('react-native').NativeModules.LocalSubOfflineModule.prepareProject,
);

describe('native speech model download progress', () => {
  beforeEach(() => {
    mockRemoveProgressListener.mockReset();
    mockAddProgressListener.mockReset();
    mockNativePrepareProject.mockReset();
  });

  it('forwards matching Android download events and removes the listener', async () => {
    let progressListener: ((event: unknown) => void) | undefined;
    mockAddProgressListener.mockImplementation(
      (_eventName: string, listener: (event: unknown) => void) => {
        progressListener = listener;
        return { remove: mockRemoveProgressListener };
      },
    );
    mockNativePrepareProject.mockImplementation(async () => {
      progressListener?.({
        localeTag: 'ko-KR',
        status: 'downloading',
        progress: 37,
      });
      progressListener?.({
        localeTag: 'fr-FR',
        status: 'downloading',
        progress: 64,
      });

      return {
        duration: 12000,
        width: 1080,
        height: 1920,
        waveform: [],
        subtitles: [],
        transcriptTimeOffsetMs: 0,
        recognitionStatus: 'ready',
        recognitionLocale: 'ko-KR',
        recognitionMode: 'manual',
      };
    });
    const onProgress = jest.fn();

    await prepareProject('file:///video.mov', 'ko-KR', 12000, onProgress);

    expect(mockAddProgressListener).toHaveBeenCalledWith(
      SPEECH_MODEL_DOWNLOAD_EVENT,
      expect.any(Function),
    );
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({
      localeTag: 'ko-KR',
      status: 'downloading',
      progress: 37,
    });
    expect(mockRemoveProgressListener).toHaveBeenCalledTimes(1);
  });
});
