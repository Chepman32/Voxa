import React from 'react';
import { LayoutAnimation, StyleSheet, Switch, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

const mockWithSpring = jest.fn(
  (
    value: number,
    _config?: { velocity?: number },
    callback?: (finished: boolean) => void,
  ) => {
    callback?.(true);
    return value;
  },
);
let mockReducedMotion = false;

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  interpolate: (value: number) => value,
  runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
  useAnimatedStyle: (factory: () => object) => factory(),
  useReducedMotion: () => mockReducedMotion,
  useSharedValue: (initialValue: number) => {
    const ReactModule = require('react');
    return ReactModule.useRef({ value: initialValue }).current;
  },
  withSpring: (
    value: number,
    config?: { velocity?: number },
    callback?: (finished: boolean) => void,
  ) => mockWithSpring(value, config, callback),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('react-native-vector-icons/Feather', () => () => null);

jest.mock('../src/components/common/AtmosphereCanvas', () => ({
  AtmosphereCanvas: () => null,
}));

jest.mock('../src/components/common/useIosScreenTransition', () => ({
  useIosScreenTransition: () => ({
    closeWithTransition: jest.fn(),
    screenTransitionStyle: undefined,
  }),
}));

jest.mock('../src/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { SettingsScreen } from '../src/components/home/SettingsScreen';

describe('SettingsScreen', () => {
  const configureNextSpy = jest
    .spyOn(LayoutAnimation, 'configureNext')
    .mockImplementation(() => {});

  beforeEach(() => {
    configureNextSpy.mockClear();
    mockReducedMotion = false;
    mockWithSpring.mockClear();
  });

  function renderSettings(notificationsAuthorized: boolean) {
    const onRequestNotificationPermission = jest.fn();
    const onResolutionChange = jest.fn();
    const onShowFolderItemCountsChange = jest.fn();
    const onUiLocaleChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          highlightEditedWords={false}
          notificationsAuthorized={notificationsAuthorized}
          notificationPermissionPending={false}
          onClose={jest.fn()}
          onHighlightEditedWordsChange={jest.fn()}
          onRememberLastTranscriptionLanguageChange={jest.fn()}
          onRequestNotificationPermission={onRequestNotificationPermission}
          onResetOnboarding={jest.fn()}
          onResolutionChange={onResolutionChange}
          onShowFolderItemCountsChange={onShowFolderItemCountsChange}
          onUiLocaleChange={onUiLocaleChange}
          preferredExportResolution="1080p"
          rememberLastTranscriptionLanguage={false}
          showFolderItemCounts={false}
          uiLocale="en"
        />,
      );
    });

    return {
      onRequestNotificationPermission,
      onResolutionChange,
      onShowFolderItemCountsChange,
      onUiLocaleChange,
      renderer: renderer!,
    };
  }

  it('does not show the app-language explanatory text', () => {
    const { renderer } = renderSettings(false);

    const explanation = renderer.root.findAll(
      node =>
        node.type === Text &&
        node.props.children === 'settingsAppLanguageDescription',
    );

    expect(explanation).toHaveLength(0);
  });

  it('shows only the selected app language while the accordion is collapsed', () => {
    const { renderer } = renderSettings(false);

    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'languageName_en',
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'languageName_es',
      ),
    ).toHaveLength(0);
  });

  it('expands the app-language accordion to reveal the other languages', () => {
    const { renderer } = renderSettings(false);
    const trigger = renderer.root.findAll(
      node =>
        node.props.accessibilityLabel === 'settingsAppLanguage' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );

    expect(trigger[0].props.accessibilityState).toEqual({ expanded: false });
    ReactTestRenderer.act(() => {
      trigger[0].props.onPress();
    });

    expect(trigger[0].props.accessibilityState).toEqual({ expanded: true });
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'languageName_es',
      ),
    ).toHaveLength(1);
  });

  it('animates expansion and collapse with directional spring velocity', () => {
    const { renderer } = renderSettings(false);
    const trigger = renderer.root.find(
      node =>
        node.props.accessibilityLabel === 'settingsAppLanguage' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    expect(mockWithSpring.mock.calls).toEqual(
      expect.arrayContaining([
        [
          1,
          expect.objectContaining({
            damping: expect.any(Number),
            stiffness: expect.any(Number),
            velocity: expect.any(Number),
          }),
        ],
      ]),
    );
    expect(
      mockWithSpring.mock.calls.some(
        ([target, config]) =>
          target === 1 && (config?.velocity ?? 0) > 0,
      ),
    ).toBe(true);
    expect(configureNextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          initialVelocity: expect.any(Number),
          springDamping: expect.any(Number),
          type: 'spring',
        }),
      }),
    );

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    expect(
      mockWithSpring.mock.calls.some(
        ([target, config]) =>
          target === 0 && (config?.velocity ?? 0) < 0,
      ),
    ).toBe(true);
  });

  it('does not clip newly revealed languages to an unmeasured zero height', () => {
    const { renderer } = renderSettings(false);
    const trigger = renderer.root.find(
      node =>
        node.props.accessibilityLabel === 'settingsAppLanguage' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    const panel = renderer.root.findByProps({
      testID: 'language-accordion-panel',
    });
    expect(StyleSheet.flatten(panel.props.style).height).not.toBe(0);
  });

  it('skips spring motion when reduced motion is enabled', () => {
    mockReducedMotion = true;
    const { renderer } = renderSettings(false);
    const trigger = renderer.root.find(
      node =>
        node.props.accessibilityLabel === 'settingsAppLanguage' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );

    ReactTestRenderer.act(() => {
      trigger.props.onPress();
    });

    expect(trigger.props.accessibilityState).toEqual({ expanded: true });
    expect(mockWithSpring).not.toHaveBeenCalled();
    expect(configureNextSpy).not.toHaveBeenCalled();
  });

  it('selects a language and collapses the accordion', () => {
    const { onUiLocaleChange, renderer } = renderSettings(false);
    const trigger = renderer.root.findAll(
      node =>
        node.props.accessibilityLabel === 'settingsAppLanguage' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );

    ReactTestRenderer.act(() => {
      trigger[0].props.onPress();
    });
    const spanishOption = renderer.root.findAll(
      node =>
        node.props.accessibilityLabel === 'languageName_es' &&
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function',
    );
    ReactTestRenderer.act(() => {
      spanishOption[0].props.onPress();
    });

    expect(onUiLocaleChange).toHaveBeenCalledWith('es');
    expect(trigger[0].props.accessibilityState).toEqual({ expanded: false });
    expect(
      renderer.root.findAll(
        node => node.type === Text && node.props.children === 'languageName_es',
      ),
    ).toHaveLength(0);
  });

  it('changes the default export resolution', () => {
    const { onResolutionChange, renderer } = renderSettings(false);
    const fourKLabel = renderer.root.find(
      node => node.type === Text && node.props.children === '4K',
    );
    let fourKOption = fourKLabel.parent;
    while (fourKOption && typeof fourKOption.props.onPress !== 'function') {
      fourKOption = fourKOption.parent;
    }

    ReactTestRenderer.act(() => {
      fourKOption!.props.onPress();
    });

    expect(onResolutionChange).toHaveBeenCalledWith('4k');
  });

  it('shows a disabled-by-default switch for folder item counts', () => {
    const { onShowFolderItemCountsChange, renderer } = renderSettings(false);
    const folderCountSwitch = renderer.root.findAllByType(Switch).find(
      node =>
        node.props.accessibilityLabel === 'settingsShowFolderItemCounts',
    );

    expect(folderCountSwitch).toBeDefined();
    expect(folderCountSwitch!.props.value).toBe(false);

    ReactTestRenderer.act(() => {
      folderCountSwitch!.props.onValueChange(true);
    });

    expect(onShowFolderItemCountsChange).toHaveBeenCalledWith(true);
  });

  it('shows a switch that requests access when notifications are not authorized', () => {
    const { onRequestNotificationPermission, renderer } =
      renderSettings(false);
    const notificationSwitch = renderer.root.findAllByType(Switch).find(
      node => node.props.accessibilityLabel === 'settingsEnableNotifications',
    );

    expect(notificationSwitch).toBeDefined();
    ReactTestRenderer.act(() => {
      notificationSwitch!.props.onValueChange(true);
    });
    expect(onRequestNotificationPermission).toHaveBeenCalledTimes(1);
  });

  it('hides the notification permission switch once access is granted', () => {
    const { renderer } = renderSettings(true);

    expect(
      renderer.root.findAllByType(Switch).filter(
        node => node.props.accessibilityLabel === 'settingsEnableNotifications',
      ),
    ).toHaveLength(0);
  });
});
