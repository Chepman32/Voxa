import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));

jest.mock('../src/components/editor/ExportSheet', () => ({
  ExportSheet: () => null,
}));

jest.mock('@react-native-community/blur', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BlurView: ({ children, ...props }: { children?: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  }),
}));

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props: object, ref: React.Ref<any>) => {
      React.useImperativeHandle(ref, () => ({
        seek: () => undefined,
      }));

      return <View {...props} />;
    }),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');

  const createGesture = () => {
    const gesture = {
      activeOffsetY: () => gesture,
      failOffsetX: () => gesture,
      numberOfTaps: () => gesture,
      onBegin: () => gesture,
      onEnd: () => gesture,
      onUpdate: () => gesture,
    };

    return gesture;
  };

  return {
    GestureDetector: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Gesture: {
      Pan: createGesture,
      Pinch: createGesture,
      Tap: createGesture,
      Race: () => createGesture(),
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const animation = {
    damping: () => animation,
    duration: () => animation,
    springify: () => animation,
  };

  const AnimatedView = React.forwardRef(
    (
      {
        children,
        entering: _entering,
        exiting: _exiting,
        ...props
      }: {
        children?: React.ReactNode;
        entering?: unknown;
        exiting?: unknown;
      },
      ref: React.Ref<any>,
    ) => <View ref={ref} {...props}>{children}</View>,
  );

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
    },
    FadeIn: animation,
    FadeOut: animation,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: <T,>(value: T) => ({ value }),
    withSpring: <T,>(value: T) => value,
  };
});

jest.mock('../src/store/app-store', () => {
  const mockState = {
    closeProject: jest.fn(),
    settings: {
      preferredExportResolution: '1080p',
    },
    setPreferredExportResolution: jest.fn(),
    upsertProject: jest.fn(),
  };

  return {
    useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

import { ACTIVE_SUBTITLE_SECTION_ID, EditorScreen } from '../src/components/editor/EditorScreen';
import { calculateEditorVerticalLayout } from '../src/components/editor/layout';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project } from '../src/types/models';

describe('editor layout budgeting', () => {
  const screenHeights = [812, 844, 932];

  it.each(screenHeights)('fits the closed editor layout on a %ipx screen', screenHeight => {
    const layout = calculateEditorVerticalLayout({
      screenHeight,
      topInset: 44,
      bottomInset: 34,
      bannerHeight: 0,
    });
    const usedHeight =
      layout.videoHeight +
      layout.timelineHeight +
      layout.textHeight +
      layout.stackGap * 2;

    expect(layout.textHeight).toBeGreaterThanOrEqual(180);
    expect(layout.videoHeight).toBeGreaterThanOrEqual(280);
    expect(layout.videoHeight).toBeLessThanOrEqual(340);
    expect(layout.timelineTrackHeight).toBeGreaterThanOrEqual(104);
    expect(layout.timelineTrackHeight).toBeLessThanOrEqual(136);
    expect(usedHeight).toBeLessThanOrEqual(layout.contentHeight);
  });

  it.each(screenHeights)(
    'keeps the active subtitle panel visible on a %ipx screen with an import banner',
    screenHeight => {
      const layout = calculateEditorVerticalLayout({
        screenHeight,
        topInset: 44,
        bottomInset: 34,
        bannerHeight: 60,
      });
      const usedHeight =
        layout.videoHeight +
        layout.timelineHeight +
        layout.textHeight +
        layout.stackGap * 2;

      expect(layout.textHeight).toBeGreaterThanOrEqual(180);
      expect(layout.videoHeight).toBeGreaterThanOrEqual(224);
      expect(layout.timelineTrackHeight).toBeGreaterThanOrEqual(92);
      expect(usedHeight).toBeLessThanOrEqual(layout.contentHeight);
    },
  );
});

describe('EditorScreen', () => {
  const mockProject: Project = {
    id: 'project-1',
    title: 'Layout check',
    sourceFileName: 'layout-check.mov',
    videoLocalURI: 'file:///tmp/layout-check.mov',
    duration: 6800,
    createdAt: 1,
    updatedAt: 1,
    subtitles: [
      {
        id: 'subtitle-1',
        startTime: 2400,
        endTime: 3200,
        text: 'first line',
      },
    ],
    globalStyle: defaultSubtitleStyle,
    waveform: [0.2, 0.4, 0.6],
    recognitionStatus: 'ready',
    metrics: { width: 1080, height: 1920 },
    lastEditedSubtitleId: 'subtitle-1',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the closed active subtitle section with the computed height', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    const expectedLayout = calculateEditorVerticalLayout({
      screenHeight: 844,
      topInset: 44,
      bottomInset: 34,
      bannerHeight: 0,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    expect(renderer!.root.findByProps({ children: 'Active Subtitle' })).toBeTruthy();

    const section = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_SECTION_ID });
    const style = StyleSheet.flatten(section.props.style);

    expect(style.height).toBeCloseTo(expectedLayout.textHeight, 5);
  });
});
