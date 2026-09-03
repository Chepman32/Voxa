import React from 'react';
import { Text } from 'react-native';
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
  it('does not show the app-language explanatory text', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          highlightEditedWords={false}
          onClose={jest.fn()}
          onHighlightEditedWordsChange={jest.fn()}
          onRememberLastTranscriptionLanguageChange={jest.fn()}
          onResetOnboarding={jest.fn()}
          onResolutionChange={jest.fn()}
          onUiLocaleChange={jest.fn()}
          preferredExportResolution="1080p"
          rememberLastTranscriptionLanguage={false}
          uiLocale="en"
        />,
      );
    });

    const explanation = renderer!.root.findAll(
      node =>
        node.type === Text &&
        node.props.children === 'settingsAppLanguageDescription',
    );

    expect(explanation).toHaveLength(0);
  });
});
