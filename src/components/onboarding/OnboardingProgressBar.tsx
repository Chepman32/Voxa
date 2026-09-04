import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { palette } from '../../theme/tokens';

interface OnboardingProgressBarProps {
  progress: number;
}

export function OnboardingProgressBar({
  progress,
}: OnboardingProgressBarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.cyan,
  },
});
