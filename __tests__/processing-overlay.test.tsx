import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-reanimated', () => {
  const { View: MockView } = require('react-native');

  return {
    __esModule: true,
    default: { View: MockView },
    Easing: {
      ease: 'ease',
      inOut: (value: unknown) => value,
    },
    interpolate: () => 1,
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: <T,>(value: T) => ({ value }),
    withRepeat: <T,>(value: T) => value,
    withTiming: <T,>(value: T) => value,
  };
});

jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));
jest.mock('../src/components/common/GlassPanel', () => {
  const ReactModule = require('react');
  const { View: MockView } = require('react-native');

  return {
    GlassPanel: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(MockView, null, children),
  };
});
jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'processingDownloadingModel'
        ? 'Downloading speech model...'
        : key,
  }),
}));

import {
  PROCESSING_DOWNLOAD_PERCENT_ID,
  PROCESSING_DOWNLOAD_PROGRESS_ID,
  ProcessingOverlay,
} from '../src/components/processing/ProcessingOverlay';

describe('ProcessingOverlay speech model progress', () => {
  it('keeps an indeterminate progress bar visible for a scheduled download', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProcessingOverlay
          processing={{
            visible: true,
            phase: 'downloading',
            label: 'Downloading speech model...',
            progress: null,
          }}
        />,
      );
    });

    try {
      const progressBar = renderer!.root.findByProps({
        testID: PROCESSING_DOWNLOAD_PROGRESS_ID,
      });

      expect(progressBar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        text: 'Downloading speech model...',
      });
      expect(
        renderer!.root.findAllByProps({
          testID: PROCESSING_DOWNLOAD_PERCENT_ID,
        }),
      ).toHaveLength(0);
    } finally {
      await ReactTestRenderer.act(() => {
        renderer!.unmount();
      });
    }
  });

  it('shows the measured download percentage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProcessingOverlay
          processing={{
            visible: true,
            phase: 'downloading',
            label: 'Downloading speech model...',
            progress: 37,
          }}
        />,
      );
    });

    try {
      const progressBar = renderer!.root.findByProps({
        testID: PROCESSING_DOWNLOAD_PROGRESS_ID,
      });
      const percent = renderer!.root.findByProps({
        testID: PROCESSING_DOWNLOAD_PERCENT_ID,
      });

      expect(progressBar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 37,
      });
      expect(percent.props.children.join('')).toBe('37%');
    } finally {
      await ReactTestRenderer.act(() => {
        renderer!.unmount();
      });
    }
  });
});
