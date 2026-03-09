import React from 'react';
import {
  Keyboard,
  StyleSheet,
} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));

jest.mock('../src/components/editor/ExportSheet', () => ({
  ExportSheet: () => null,
}));

jest.mock('@react-native-community/blur', () => {
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
  const { Text } = require('react-native');

  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

jest.mock('react-native-video', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ReactModule.forwardRef((props: object, ref: React.Ref<any>) => {
      ReactModule.useImperativeHandle(ref, () => ({
        seek: () => undefined,
      }));

      return <View {...props} />;
    }),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const createGesture = () => {
    const gesture = {
      activeOffsetY: () => gesture,
      failOffsetX: () => gesture,
      numberOfTaps: () => gesture,
      onBegin: () => gesture,
      onEnd: () => gesture,
      onFinalize: () => gesture,
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
  const ReactModule = require('react');
  const { View } = require('react-native');

  const animation = {
    damping: () => animation,
    duration: () => animation,
    springify: () => animation,
  };

  const AnimatedView = ReactModule.forwardRef(
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
    withTiming: <T,>(value: T) => value,
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

import {
  ACTIVE_SUBTITLE_HEADER_ID,
  ACTIVE_SUBTITLE_NEXT_BUTTON_ID,
  ACTIVE_SUBTITLE_PREV_BUTTON_ID,
  ACTIVE_SUBTITLE_SECTION_ID,
  BOTTOM_EDITOR_PAGER_ID,
  BOTTOM_EDITOR_PRIMARY_TAB_ID,
  BOTTOM_EDITOR_SHELL_ID,
  BOTTOM_EDITOR_STYLE_TAB_ID,
  EDITOR_TOP_BAR_ID,
  EditorScreen,
  KEYBOARD_DISMISS_BUTTON_ID,
  OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX,
  TIMELINE_SECTION_ID,
  resolveOverlaySubtitle,
  resolveSubtitlePreviewTop,
} from '../src/components/editor/EditorScreen';
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
      layout.bottomEditorTabsHeight +
      layout.textHeight +
      layout.stackGap * 2;

    expect(layout.textHeight).toBeGreaterThanOrEqual(180);
    expect(layout.videoHeight).toBeGreaterThanOrEqual(240);
    expect(layout.videoHeight).toBeLessThanOrEqual(340);
    expect(layout.timelineControlsHeight).toBe(128);
    expect(layout.timelineTrackHeight).toBeGreaterThanOrEqual(56);
    expect(layout.timelineTrackHeight).toBeLessThanOrEqual(72);
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
        layout.bottomEditorTabsHeight +
        layout.textHeight +
        layout.stackGap * 2;

      expect(layout.textHeight).toBeGreaterThanOrEqual(180);
      expect(layout.videoHeight).toBeGreaterThanOrEqual(180);
      expect(layout.timelineControlsHeight).toBe(128);
      expect(layout.timelineTrackHeight).toBeGreaterThanOrEqual(40);
      expect(usedHeight).toBeLessThanOrEqual(layout.contentHeight);
    },
  );

  it.each(screenHeights)('expands the text editor when the timeline is collapsed on a %ipx screen', screenHeight => {
    const expandedLayout = calculateEditorVerticalLayout({
      screenHeight,
      topInset: 44,
      bottomInset: 34,
      bannerHeight: 0,
      timelineCollapsed: false,
    });
    const collapsedLayout = calculateEditorVerticalLayout({
      screenHeight,
      topInset: 44,
      bottomInset: 34,
      bannerHeight: 0,
      timelineCollapsed: true,
    });
    const usedHeight =
      collapsedLayout.videoHeight +
      collapsedLayout.timelineHeight +
      collapsedLayout.bottomEditorTabsHeight +
      collapsedLayout.textHeight +
      collapsedLayout.stackGap * 2;

    expect(collapsedLayout.timelineTrackHeight).toBe(0);
    expect(collapsedLayout.timelineControlsHeight).toBe(0);
    expect(collapsedLayout.timelineHeight).toBe(0);
    expect(collapsedLayout.textHeight).toBeGreaterThan(expandedLayout.textHeight);
    expect(usedHeight).toBeLessThanOrEqual(collapsedLayout.contentHeight);
  });
});

describe('EditorScreen drag helpers', () => {
  it('keeps the drag preview anchored to the captured drag start until finalize', () => {
    expect(
      resolveSubtitlePreviewTop({
        isDragging: true,
        dragStartTop: 132,
        liveAnchorTop: 44,
        translationY: 18,
        minTop: 16,
        maxTop: 220,
      }),
    ).toBe(150);

    expect(
      resolveSubtitlePreviewTop({
        isDragging: false,
        dragStartTop: 132,
        liveAnchorTop: 44,
        translationY: 18,
        minTop: 16,
        maxTop: 220,
      }),
    ).toBe(62);
  });

  it('freezes the dragged subtitle content until the drag session ends', () => {
    const draggedSubtitle = {
      id: 'subtitle-dragged',
      startTime: 0,
      endTime: 1000,
      text: 'dragged text',
    };
    const liveSubtitle = {
      id: 'subtitle-live',
      startTime: 1000,
      endTime: 2000,
      text: 'live text',
    };

    expect(
      resolveOverlaySubtitle({
        isDragging: true,
        draggedSubtitleSnapshot: draggedSubtitle,
        navigationPinnedSubtitleSnapshot: null,
        liveSubtitle,
      }),
    ).toBe(draggedSubtitle);
    expect(
      resolveOverlaySubtitle({
        isDragging: false,
        draggedSubtitleSnapshot: draggedSubtitle,
        navigationPinnedSubtitleSnapshot: draggedSubtitle,
        liveSubtitle,
      }),
    ).toBe(draggedSubtitle);
    expect(
      resolveOverlaySubtitle({
        isDragging: false,
        draggedSubtitleSnapshot: draggedSubtitle,
        navigationPinnedSubtitleSnapshot: null,
        liveSubtitle,
      }),
    ).toBe(liveSubtitle);
  });
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
        startTime: 0,
        endTime: 3200,
        text: 'first bright line',
        words: [
          { text: 'first', startTime: 0, endTime: 700 },
          { text: 'bright', startTime: 800, endTime: 1500 },
          { text: 'line', startTime: 1600, endTime: 2400 },
        ],
      },
      {
        id: 'subtitle-2',
        startTime: 3400,
        endTime: 5200,
        text: 'second bright line',
        words: [
          { text: 'second', startTime: 3400, endTime: 3900 },
          { text: 'bright', startTime: 3950, endTime: 4500 },
          { text: 'line', startTime: 4550, endTime: 5100 },
        ],
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
    expect(renderer!.root.findAllByProps({ children: 'Export' })).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: 'Swipe left or right to move between blocks.',
      }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        children: 'Swipe up or tap Style for selectors.',
      }),
    ).toHaveLength(0);

    const section = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_SECTION_ID });
    const style = StyleSheet.flatten(section.props.style);

    expect(style.height).toBeCloseTo(expectedLayout.textHeight, 5);
  });

  it('collapses the timeline and expands the active subtitle section when the keyboard is visible', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    const keyboardListeners: Record<
      string,
      Array<(event?: { endCoordinates?: { height?: number } }) => void>
    > = {};
    const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    jest.spyOn(Keyboard, 'addListener').mockImplementation((eventName, listener) => {
      keyboardListeners[eventName] ??= [];
      keyboardListeners[eventName].push(
        listener as (event?: { endCoordinates?: { height?: number } }) => void,
      );

      return {
        remove: jest.fn(),
      };
    });

    const expandedLayout = calculateEditorVerticalLayout({
      screenHeight: 844,
      topInset: 44,
      bottomInset: 34,
      bannerHeight: 0,
      timelineCollapsed: false,
    });
    const collapsedLayout = calculateEditorVerticalLayout({
      screenHeight: 844,
      topInset: 44,
      bottomInset: 336,
      bannerHeight: 0,
      timelineCollapsed: true,
      topBarCollapsed: true,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    let timelineSection = renderer!.root.findByProps({ testID: TIMELINE_SECTION_ID });
    let timelineStyle = StyleSheet.flatten(timelineSection.props.style);
    let activeSubtitleSection = renderer!.root.findByProps({
      testID: ACTIVE_SUBTITLE_SECTION_ID,
    });
    let textStyle = StyleSheet.flatten(activeSubtitleSection.props.style);
    let topBar = renderer!.root.findByProps({ testID: EDITOR_TOP_BAR_ID });
    let topBarStyle = StyleSheet.flatten(topBar.props.style);
    let bottomEditorShell = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_SHELL_ID });
    let bottomEditorShellStyle = StyleSheet.flatten(bottomEditorShell.props.style);
    let dismissButtons = renderer!.root.findAll(
      node =>
        node.props.testID === KEYBOARD_DISMISS_BUTTON_ID &&
        typeof node.props.onPress === 'function',
    );

    expect(timelineSection.props.pointerEvents).toBe('auto');
    expect(timelineStyle.height).toBeCloseTo(expandedLayout.timelineTrackHeight, 5);
    expect(textStyle.height).toBeCloseTo(expandedLayout.textHeight, 5);
    expect(topBar.props.pointerEvents).toBe('auto');
    expect(topBarStyle.height).toBe(34);
    expect(bottomEditorShellStyle.height).toBeGreaterThan(expandedLayout.textHeight);
    expect(dismissButtons).toHaveLength(0);
    expect(renderer!.root.findByProps({ testID: BOTTOM_EDITOR_PAGER_ID })).toBeTruthy();

    await ReactTestRenderer.act(() => {
      renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_HEADER_ID }).props.onPress();
    });

    await ReactTestRenderer.act(() => {
      keyboardListeners.keyboardWillShow?.forEach(listener => {
        listener({
          endCoordinates: {
            height: 336,
          },
        });
      });
    });

    timelineSection = renderer!.root.findByProps({ testID: TIMELINE_SECTION_ID });
    timelineStyle = StyleSheet.flatten(timelineSection.props.style);
    activeSubtitleSection = renderer!.root.findByProps({
      testID: ACTIVE_SUBTITLE_SECTION_ID,
    });
    textStyle = StyleSheet.flatten(activeSubtitleSection.props.style);
    topBar = renderer!.root.findByProps({ testID: EDITOR_TOP_BAR_ID });
    topBarStyle = StyleSheet.flatten(topBar.props.style);
    bottomEditorShell = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_SHELL_ID });
    bottomEditorShellStyle = StyleSheet.flatten(bottomEditorShell.props.style);
    dismissButtons = renderer!.root.findAll(
      node =>
        node.props.testID === KEYBOARD_DISMISS_BUTTON_ID &&
        typeof node.props.onPress === 'function',
    );

    expect(timelineSection.props.pointerEvents).toBe('none');
    expect(timelineStyle.height).toBe(0);
    expect(timelineStyle.opacity).toBe(0);
    expect(topBar.props.pointerEvents).toBe('none');
    expect(topBarStyle.height).toBe(0);
    expect(topBarStyle.opacity).toBe(0);
    expect(textStyle.height).toBeCloseTo(collapsedLayout.textHeight, 5);
    expect(bottomEditorShellStyle.height).toBeGreaterThan(textStyle.height);
    expect(dismissButtons).toHaveLength(1);

    await ReactTestRenderer.act(() => {
      dismissButtons[0].props.onPress();
    });

    expect(dismissKeyboard).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(() => {
      renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_HEADER_ID }).props.onPress();
    });

    expect(dismissKeyboard).toHaveBeenCalledTimes(2);

    await ReactTestRenderer.act(() => {
      keyboardListeners.keyboardWillHide?.forEach(listener => {
        listener();
      });
    });

    timelineSection = renderer!.root.findByProps({ testID: TIMELINE_SECTION_ID });
    timelineStyle = StyleSheet.flatten(timelineSection.props.style);
    activeSubtitleSection = renderer!.root.findByProps({
      testID: ACTIVE_SUBTITLE_SECTION_ID,
    });
    textStyle = StyleSheet.flatten(activeSubtitleSection.props.style);
    topBar = renderer!.root.findByProps({ testID: EDITOR_TOP_BAR_ID });
    topBarStyle = StyleSheet.flatten(topBar.props.style);
    dismissButtons = renderer!.root.findAll(
      node =>
        node.props.testID === KEYBOARD_DISMISS_BUTTON_ID &&
        typeof node.props.onPress === 'function',
    );

    expect(timelineSection.props.pointerEvents).toBe('auto');
    expect(timelineStyle.height).toBeCloseTo(expandedLayout.timelineTrackHeight, 5);
    expect(timelineStyle.opacity).toBe(1);
    expect(topBar.props.pointerEvents).toBe('auto');
    expect(topBarStyle.height).toBe(34);
    expect(topBarStyle.opacity).toBe(1);
    expect(textStyle.height).toBeCloseTo(expandedLayout.textHeight, 5);
    expect(dismissButtons).toHaveLength(0);
  });

  it('switches the bottom editor between subtitle and style slides', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    let subtitleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_PRIMARY_TAB_ID });
    let styleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_STYLE_TAB_ID });
    const pager = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_PAGER_ID });

    expect(subtitleTab.props.accessibilityState.selected).toBe(true);
    expect(styleTab.props.accessibilityState.selected).toBe(false);

    await ReactTestRenderer.act(() => {
      pager.props.onMomentumScrollEnd({
        nativeEvent: {
          contentOffset: {
            x: 390,
            y: 0,
          },
        },
      });
    });

    subtitleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_PRIMARY_TAB_ID });
    styleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_STYLE_TAB_ID });
    expect(subtitleTab.props.accessibilityState.selected).toBe(false);
    expect(styleTab.props.accessibilityState.selected).toBe(true);

    await ReactTestRenderer.act(() => {
      pager.props.onMomentumScrollEnd({
        nativeEvent: {
          contentOffset: {
            x: 0,
            y: 0,
          },
        },
      });
    });

    subtitleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_PRIMARY_TAB_ID });
    styleTab = renderer!.root.findByProps({ testID: BOTTOM_EDITOR_STYLE_TAB_ID });
    expect(subtitleTab.props.accessibilityState.selected).toBe(true);
    expect(styleTab.props.accessibilityState.selected).toBe(false);
  });

  it('navigates between subtitle blocks with the active subtitle arrow buttons', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    let prevButton = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_PREV_BUTTON_ID });
    let nextButton = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_NEXT_BUTTON_ID });

    expect(prevButton.props.disabled).toBe(true);
    expect(nextButton.props.disabled).toBe(false);
    expect(renderer!.root.findByProps({ children: '0:00 - 0:03' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'first bright line' })).toBeTruthy();

    await ReactTestRenderer.act(() => {
      nextButton.props.onPress();
    });

    prevButton = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_PREV_BUTTON_ID });
    nextButton = renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_NEXT_BUTTON_ID });

    expect(prevButton.props.disabled).toBe(false);
    expect(nextButton.props.disabled).toBe(true);
    expect(renderer!.root.findByProps({ children: '0:03 - 0:05' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'second bright line' })).toBeTruthy();

    await ReactTestRenderer.act(() => {
      prevButton.props.onPress();
    });

    expect(renderer!.root.findByProps({ children: '0:00 - 0:03' })).toBeTruthy();
    expect(renderer!.root.findByProps({ children: 'first bright line' })).toBeTruthy();
  });

  it('highlights the active subtitle word during playback', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    const video = renderer!.root.find(
      node => typeof node.props.onProgress === 'function',
    );

    await ReactTestRenderer.act(() => {
      video.props.onProgress({ currentTime: 1 });
    });

    const activeWord = renderer!.root.findByProps({
      testID: `${OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX}-1`,
    });
    const inactiveWord = renderer!.root.findByProps({
      testID: `${OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX}-0`,
    });

    expect(activeWord.props.style).toEqual({ color: defaultSubtitleStyle.accentColor });
    expect(inactiveWord.props.style).toBeUndefined();
  });

  it('keeps generated word highlighting after focusing and blurring without a real text edit', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    const video = renderer!.root.find(
      node => typeof node.props.onProgress === 'function',
    );

    await ReactTestRenderer.act(() => {
      video.props.onProgress({ currentTime: 1 });
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_HEADER_ID }).props.onPress();
    });

    const textInput = renderer!.root.findByProps({ placeholder: 'Rewrite subtitle text' });

    await ReactTestRenderer.act(() => {
      textInput.props.onBlur();
    });

    const activeWord = renderer!.root.findByProps({
      testID: `${OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX}-1`,
    });

    expect(activeWord.props.style).toEqual({ color: defaultSubtitleStyle.accentColor });
  });

  it('keeps the active subtitle input typography aligned with the preview while editing', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_HEADER_ID }).props.onPress();
    });

    const textInput = renderer!.root.findByProps({ placeholder: 'Rewrite subtitle text' });
    const inputStyle = StyleSheet.flatten(textInput.props.style);

    expect(inputStyle.fontSize).toBe(28);
    expect(inputStyle.lineHeight).toBe(34);
    expect(inputStyle.fontWeight).toBe('800');
    expect(inputStyle.padding).toBe(0);
  });

  it('falls back to plain text after a real manual subtitle edit', async () => {
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditorScreen onClose={jest.fn()} project={mockProject} />,
      );
    });

    await ReactTestRenderer.act(() => {
      renderer!.root.findByProps({ testID: ACTIVE_SUBTITLE_HEADER_ID }).props.onPress();
    });

    const textInput = renderer!.root.findByProps({ placeholder: 'Rewrite subtitle text' });

    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('rewritten text');
    });

    const updatedTextInput = renderer!.root.findByProps({ placeholder: 'Rewrite subtitle text' });

    await ReactTestRenderer.act(() => {
      updatedTextInput.props.onBlur();
    });

    expect(
      renderer!.root.findAllByProps({
        testID: `${OVERLAY_SUBTITLE_WORD_TEST_ID_PREFIX}-0`,
      }),
    ).toHaveLength(0);
    expect(renderer!.root.findAllByProps({ children: 'rewritten text' }).length).toBeGreaterThan(0);
  });
});
