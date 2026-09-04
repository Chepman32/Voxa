import React from 'react';
import { Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

const mockShowMenu = jest.fn();

jest.mock('@react-native-menu/menu', () => {
  const ReactModule = require('react');

  return {
    MenuView: ReactModule.forwardRef(
      (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
        ReactModule.useImperativeHandle(ref, () => ({ show: mockShowMenu }));
        return ReactModule.createElement('MenuViewMock', props, props.children);
      },
    ),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const ReactModule = require('react');

  const createGesture = (kind: string) => {
    const handlers: Record<string, (...args: any[]) => unknown> = {};
    const settings: Record<string, unknown> = {};
    const gesture = {
      testHandlers: handlers,
      testKind: kind,
      testSettings: settings,
      activeOffsetX: (value: unknown) => {
        settings.activeOffsetX = value;
        return gesture;
      },
      enabled: (value: unknown) => {
        settings.enabled = value;
        return gesture;
      },
      failOffsetY: (value: unknown) => {
        settings.failOffsetY = value;
        return gesture;
      },
      onEnd: (handler: (...args: any[]) => unknown) => {
        handlers.onEnd = handler;
        return gesture;
      },
      onStart: (handler: (...args: any[]) => unknown) => {
        handlers.onStart = handler;
        return gesture;
      },
      onUpdate: (handler: (...args: any[]) => unknown) => {
        handlers.onUpdate = handler;
        return gesture;
      },
    };

    return gesture;
  };

  return {
    GestureDetector: ({
      children,
      gesture,
    }: {
      children: React.ReactNode;
      gesture: unknown;
    }) =>
      ReactModule.createElement('GestureDetectorMock', { gesture }, children),
    Gesture: {
      Exclusive: (...gestures: unknown[]) => ({
        testGestures: gestures,
        testKind: 'exclusive',
      }),
      LongPress: () => createGesture('long-press'),
      Pan: () => createGesture('pan'),
      Simultaneous: (...gestures: unknown[]) => ({
        testGestures: gestures,
        testKind: 'simultaneous',
      }),
      Tap: () => createGesture('tap'),
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: { View },
    interpolate: (_value: number, _input: number[], output: number[]) =>
      output[0],
    runOnJS: (callback: (...args: any[]) => unknown) => callback,
    useAnimatedStyle: (callback: () => object) => callback(),
    useSharedValue: <T,>(value: T) => ({ value }),
    withSpring: <T,>(value: T) => value,
  };
});

jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('../src/components/common/GlassPanel', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return {
    GlassPanel: ({ children, ...props }: React.PropsWithChildren<object>) =>
      ReactModule.createElement(View, props, children),
  };
});
jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../src/services/haptics', () => ({
  haptics: {
    heavy: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
  },
}));

import { ProjectCard } from '../src/components/home/ProjectCard';
import { defaultSubtitleStyle } from '../src/theme/tokens';
import type { Project } from '../src/types/models';

const project: Project = {
  id: 'project-1',
  title: 'Project',
  sourceFileName: 'project.mov',
  videoLocalURI: 'file:///tmp/project.mov',
  duration: 10,
  createdAt: 1,
  updatedAt: 1,
  subtitles: [],
  globalStyle: defaultSubtitleStyle,
  waveform: [],
  recognitionStatus: 'ready',
  metrics: { width: 1080, height: 1920 },
};
const originalPlatformOS = Platform.OS;

function renderProjectCard(
  overrides: Partial<React.ComponentProps<typeof ProjectCard>> = {},
) {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <ProjectCard
        contextMenuActions={[{ id: 'rename', title: 'Rename' }]}
        onContextMenuAction={jest.fn()}
        onOpen={jest.fn()}
        project={project}
        height={224}
        width={160}
        {...overrides}
      />,
    );
  });

  return renderer!;
}

function getCardGestures(renderer: ReactTestRenderer.ReactTestRenderer) {
  const detector = renderer.root.findByType('GestureDetectorMock' as never);
  const gesture = detector.props.gesture;
  const longPress =
    gesture.testKind === 'exclusive' ? gesture.testGestures[0] : undefined;
  const cardGestures =
    gesture.testKind === 'exclusive' ? gesture.testGestures[1] : gesture;
  const [pan, tap] = cardGestures.testGestures;

  return { cardGestures, gesture, longPress, pan, tap };
}

describe('ProjectCard Android context menu', () => {
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  afterEach(() => {
    mockShowMenu.mockClear();
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS,
    });
  });

  it('keeps the native menu anchor outside the project tap target', () => {
    const renderer = renderProjectCard();
    const anchor = renderer.root.findByProps({
      testID: 'project-card-android-menu-anchor',
    });

    expect(anchor.props.pointerEvents).toBe('none');
    expect(anchor.findAllByType('MenuViewMock' as never)).toHaveLength(1);
    expect(anchor.findAllByType('GestureDetectorMock' as never)).toHaveLength(
      0,
    );
  });

  it('gives long press priority over the project-opening tap', () => {
    const onOpen = jest.fn();
    const renderer = renderProjectCard({ onOpen });
    const { cardGestures, gesture, longPress } = getCardGestures(renderer);

    expect(gesture.testKind).toBe('exclusive');
    expect(longPress.testKind).toBe('long-press');
    expect(cardGestures.testKind).toBe('simultaneous');

    longPress.testHandlers.onStart();

    expect(mockShowMenu).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens the project on a successful tap without opening its menu', () => {
    const onOpen = jest.fn();
    const renderer = renderProjectCard({ onOpen });
    const { tap } = getCardGestures(renderer);

    tap.testHandlers.onEnd({}, false);
    expect(onOpen).not.toHaveBeenCalled();

    tap.testHandlers.onEnd({}, true);

    expect(onOpen).toHaveBeenCalledWith(project.id);
    expect(mockShowMenu).not.toHaveBeenCalled();
  });

  it('keeps swipe-to-delete behavior alongside exclusive long press', () => {
    const onDelete = jest.fn();
    const renderer = renderProjectCard({ onDelete });
    const { pan } = getCardGestures(renderer);

    pan.testHandlers.onUpdate({ translationX: -80 });
    pan.testHandlers.onEnd();

    expect(onDelete).toHaveBeenCalledWith(project.id);

    pan.testHandlers.onUpdate({ translationX: -10 });
    pan.testHandlers.onEnd();

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('dispatches actions from the isolated Android menu anchor', () => {
    const onContextMenuAction = jest.fn();
    const renderer = renderProjectCard({ onContextMenuAction });
    const menu = renderer.root.findByType('MenuViewMock' as never);

    menu.props.onPressAction({ nativeEvent: { event: 'rename' } });

    expect(onContextMenuAction).toHaveBeenCalledWith('rename', project.id);
  });

  it('preserves the native long-press wrapper on iOS', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    const onContextMenuAction = jest.fn();

    try {
      const renderer = renderProjectCard({ onContextMenuAction });
      const menu = renderer.root.findByType('MenuViewMock' as never);

      expect(menu.findAllByType('GestureDetectorMock' as never)).toHaveLength(
        1,
      );
      expect(
        renderer.root.findAllByProps({
          testID: 'project-card-android-menu-anchor',
        }),
      ).toHaveLength(0);

      menu.props.onPressAction({ nativeEvent: { event: 'rename' } });
      expect(onContextMenuAction).toHaveBeenCalledWith('rename', project.id);
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: 'android',
      });
    }
  });
});
