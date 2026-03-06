import React from 'react';
import { StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';

import { palette } from '../../theme/tokens';

export function AtmosphereCanvas({
  style,
  intensity = 1,
}: {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas style={[styles.fill, style]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={[palette.canvas, palette.black]}
        />
      </Rect>

      <Circle
        cx={width * 0.2}
        cy={height * 0.18}
        r={width * 0.28 * intensity}>
        <LinearGradient
          start={vec(width * 0.02, 0)}
          end={vec(width * 0.34, height * 0.35)}
          colors={['rgba(0, 240, 255, 0.28)', 'rgba(0, 240, 255, 0.02)']}
        />
        <BlurMask blur={64} style="solid" />
      </Circle>

      <Circle
        cx={width * 0.85}
        cy={height * 0.28}
        r={width * 0.22 * intensity}>
        <LinearGradient
          start={vec(width * 0.75, height * 0.08)}
          end={vec(width, height * 0.4)}
          colors={['rgba(138, 43, 226, 0.24)', 'rgba(138, 43, 226, 0.02)']}
        />
        <BlurMask blur={56} style="solid" />
      </Circle>

      <Circle
        cx={width * 0.48}
        cy={height * 0.86}
        r={width * 0.38 * intensity}>
        <LinearGradient
          start={vec(width * 0.22, height * 0.6)}
          end={vec(width * 0.76, height)}
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
        />
        <BlurMask blur={72} style="solid" />
      </Circle>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
