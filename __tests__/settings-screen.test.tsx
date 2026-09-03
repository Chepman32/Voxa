import React from 'react';
import { Switch, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
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
  function renderSettings(notificationsAuthorized: boolean) {
    const onRequestNotificationPermission = jest.fn();
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
          onResolutionChange={jest.fn()}
          onUiLocaleChange={jest.fn()}
          preferredExportResolution="1080p"
          rememberLastTranscriptionLanguage={false}
          uiLocale="en"
        />,
      );
    });

    return { onRequestNotificationPermission, renderer: renderer! };
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
