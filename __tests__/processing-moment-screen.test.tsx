import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: { View },
    Easing: {
      ease: 'ease',
      inOut: (value: unknown) => value,
      linear: 'linear',
    },
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: <T,>(value: T) => ({ value }),
    withRepeat: <T,>(value: T) => value,
    withTiming: <T,>(value: T) => value,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('../src/components/onboarding/OnboardingHeader', () => ({
  OnboardingHeader: () => null,
}));
jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { ProcessingMomentScreen } from '../src/components/onboarding/ProcessingMomentScreen';

function renderedPhase(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .find(value => /^procPhase/.test(String(value)));
}

describe('ProcessingMomentScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('cycles through each processing phase', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProcessingMomentScreen onComplete={jest.fn()} progress={0.875} />,
      );
    });

    expect(renderedPhase(renderer!)).toBe('procPhase1');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(renderedPhase(renderer!)).toBe('procPhase2');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(renderedPhase(renderer!)).toBe('procPhase3');

    ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });

  it('completes after the processing sequence', () => {
    const onComplete = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProcessingMomentScreen onComplete={onComplete} progress={0.875} />,
      );
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(2800);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });
});
