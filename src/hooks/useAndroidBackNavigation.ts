import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import type { AppRoute } from '../types/models';

interface AndroidBackNavigationOptions {
  route: AppRoute;
  onCloseEditor: () => void;
  onCloseSettings: () => void;
}

export function useAndroidBackNavigation({
  route,
  onCloseEditor,
  onCloseSettings,
}: AndroidBackNavigationOptions) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (route === 'settings') {
          onCloseSettings();
          return true;
        }

        if (route === 'editor') {
          onCloseEditor();
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [onCloseEditor, onCloseSettings, route]);
}
