import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import { palette } from '../../theme/tokens';
import type { ProcessingState } from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { GlassPanel } from '../common/GlassPanel';

const icons = ['video', 'mic', 'file-text'] as const;

export function ProcessingOverlay({ processing }: { processing: ProcessingState }) {
  const [iconIndex, setIconIndex] = useState(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!processing.visible) {
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    const timer = setInterval(() => {
      setIconIndex(current => (current + 1) % icons.length);
    }, 720);

    return () => {
      clearInterval(timer);
    };
  }, [processing.visible, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1.06]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
  }));

  if (!processing.visible) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.root}>
      <AtmosphereCanvas intensity={1.24} />
      <View style={styles.backdrop} />

      <GlassPanel style={styles.panel}>
        <Animated.View style={[styles.ring, ringStyle]}>
          <View style={styles.ringInner}>
            <Feather color={palette.cyan} name={icons[iconIndex]} size={34} />
          </View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>Offline AI</Text>
          <Text style={styles.label}>{processing.label}</Text>
          <Text style={styles.body}>
            Voxa is processing your video locally on-device.
          </Text>
        </View>

        <ActivityIndicator color={palette.cyan} />
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  panel: {
    width: '84%',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 18,
  },
  ring: {
    width: 144,
    height: 144,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  ringInner: {
    width: 106,
    height: 106,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 17, 22, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
