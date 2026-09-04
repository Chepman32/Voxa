import React from 'react';
import { BackHandler } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { useAndroidBackNavigation } from '../src/hooks/useAndroidBackNavigation';
import type { AppRoute } from '../src/types/models';

let hardwareBackPress: () => boolean | null | undefined;
const mockRemove = jest.fn();

function BackNavigationHarness({
  route,
  onCloseEditor,
  onCloseSettings,
}: {
  route: AppRoute;
  onCloseEditor: () => void;
  onCloseSettings: () => void;
}) {
  useAndroidBackNavigation({ route, onCloseEditor, onCloseSettings });
  return null;
}

function renderHarness(route: AppRoute) {
  const onCloseEditor = jest.fn();
  const onCloseSettings = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <BackNavigationHarness
        onCloseEditor={onCloseEditor}
        onCloseSettings={onCloseSettings}
        route={route}
      />,
    );
  });

  return { onCloseEditor, onCloseSettings, renderer: renderer! };
}

describe('useAndroidBackNavigation', () => {
  beforeEach(() => {
    mockRemove.mockClear();
    hardwareBackPress = () => false;
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, listener) => {
        hardwareBackPress = listener;
        return { remove: mockRemove };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('closes Settings and consumes Android Back', () => {
    const { onCloseEditor, onCloseSettings } = renderHarness('settings');

    expect(hardwareBackPress()).toBe(true);
    expect(onCloseSettings).toHaveBeenCalledTimes(1);
    expect(onCloseEditor).not.toHaveBeenCalled();
  });

  it('closes the editor and consumes Android Back', () => {
    const { onCloseEditor, onCloseSettings } = renderHarness('editor');

    expect(hardwareBackPress()).toBe(true);
    expect(onCloseEditor).toHaveBeenCalledTimes(1);
    expect(onCloseSettings).not.toHaveBeenCalled();
  });

  it('lets Android handle Back from Home', () => {
    const { onCloseEditor, onCloseSettings } = renderHarness('home');

    expect(hardwareBackPress()).toBe(false);
    expect(onCloseEditor).not.toHaveBeenCalled();
    expect(onCloseSettings).not.toHaveBeenCalled();
  });

  it('removes the Back handler on unmount', () => {
    const { renderer } = renderHarness('settings');

    ReactTestRenderer.act(() => {
      renderer.unmount();
    });

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
