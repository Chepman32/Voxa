import { useCallback, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const ENTER_SPRING = {
  damping: 34,
  energyThreshold: 0.0006,
  mass: 0.92,
  stiffness: 360,
  velocity: 5.4,
};

const EXIT_SPRING = {
  damping: 31,
  energyThreshold: 0.0008,
  mass: 0.86,
  stiffness: 380,
  velocity: -5.8,
};

export function useIosScreenTransition(onExited: () => void) {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);
  const closingRef = useRef(false);
  const onExitedRef = useRef(onExited);
  const pendingExitCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  const finishExit = useCallback(() => {
    const callback = pendingExitCallbackRef.current ?? onExitedRef.current;
    pendingExitCallbackRef.current = null;
    callback();
  }, []);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSpring(1, ENTER_SPRING);
  }, [progress]);

  const closeWithTransition = useCallback(
    (afterExit?: () => void) => {
      if (closingRef.current) {
        return;
      }

      closingRef.current = true;
      pendingExitCallbackRef.current = afterExit ?? null;
      progress.value = withSpring(0, EXIT_SPRING, finished => {
        if (finished) {
          runOnJS(finishExit)();
        }
      });
    },
    [finishExit, progress],
  );

  const screenTransitionStyle = useAnimatedStyle(() => {
    const hiddenOffset = width + 32;
    return {
      opacity: 0.78 + progress.value * 0.22,
      transform: [
        { translateX: (1 - progress.value) * hiddenOffset },
        { scale: 0.985 + progress.value * 0.015 },
      ],
    };
  }, [width]);

  return {
    closeWithTransition,
    screenTransitionStyle,
  };
}
