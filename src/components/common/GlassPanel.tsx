import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

import { palette } from '../../theme/tokens';

export function GlassPanel({
  children,
  style,
  blurAmount = 22,
  ...rest
}: ViewProps & { style?: StyleProp<ViewStyle>; blurAmount?: number }) {
  return (
    <View {...rest} style={[styles.shell, style]}>
      <BlurView
        blurAmount={blurAmount}
        blurType="dark"
        reducedTransparencyFallbackColor="rgba(15, 16, 19, 0.92)"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.overlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});
