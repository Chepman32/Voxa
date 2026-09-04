import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: { View },
    Easing: {
      cubic: 'cubic',
      in: (value: unknown) => value,
      out: (value: unknown) => value,
      quad: 'quad',
    },
    FadeOut: { duration: () => 'fade-out' },
    interpolate: (_value: number, _input: number[], output: number[]) =>
      output[0],
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: <T,>(value: T) => ({ value }),
    withDelay: <T,>(_delay: number, value: T) => value,
    withTiming: <T,>(value: T) => value,
  };
});

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));
jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../src/services/haptics', () => ({
  haptics: { heavy: jest.fn() },
}));

import { SplashSequence } from '../src/components/splash/SplashSequence';

describe('SplashSequence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('keeps layout-exit opacity separate from shared-value opacity', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SplashSequence onComplete={jest.fn()} />,
      );
    });

    const conflictingViews = renderer!.root.findAll(node => {
      if (node.props.exiting === undefined) {
        return false;
      }

      return StyleSheet.flatten(node.props.style).opacity !== undefined;
    });

    expect(conflictingViews).toHaveLength(0);

    ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });
});
