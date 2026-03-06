import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../../services/haptics';
import { palette } from '../../theme/tokens';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';

interface SplashSequenceProps {
  onComplete: () => void;
}

const SPLASH_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: 28 + ((index * 21) % 280),
  top: 180 + ((index * 26) % 240),
  distance: 140 + (index % 5) * 44,
  drift: index % 2 === 0 ? -26 : 28,
  delay: index * 20,
}));

export function SplashSequence({ onComplete }: SplashSequenceProps) {
  const distortion = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const shellOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 280 });
    distortion.value = withTiming(0.08, {
      duration: 860,
      easing: Easing.out(Easing.cubic),
    });
    particleProgress.value = withDelay(
      980,
      withTiming(1, {
        duration: 900,
        easing: Easing.in(Easing.quad),
      }),
    );
    shellOpacity.value = withDelay(1620, withTiming(0, { duration: 320 }));

    const impactTimer = setTimeout(() => {
      haptics.heavy();
    }, 840);

    const doneTimer = setTimeout(() => {
      onComplete();
    }, 1950);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(doneTimer);
    };
  }, [distortion, logoOpacity, onComplete, particleProgress, shellOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * shellOpacity.value,
    transform: [
      { scale: interpolate(distortion.value, [1, 0], [1.18, 1]) },
      { rotateZ: `${interpolate(distortion.value, [1, 0], [18, 0])}deg` },
      { translateY: interpolate(distortion.value, [1, 0], [-18, 0]) },
    ],
  }));

  const shellStyle = useAnimatedStyle(() => ({
    opacity: shellOpacity.value,
  }));

  return (
    <Animated.View exiting={FadeOut.duration(220)} style={[styles.root, shellStyle]}>
      <AtmosphereCanvas intensity={1.15} />
      <View style={styles.vignette} />

      {SPLASH_PARTICLES.map(particle => (
        <SplashParticle
          key={particle.id}
          delay={particle.delay}
          distance={particle.distance}
          drift={particle.drift}
          left={particle.left}
          particleProgress={particleProgress}
          top={particle.top}
        />
      ))}

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Text style={styles.logo}>VOXA</Text>
        <View style={styles.logoGlow} />
      </Animated.View>
      <Text style={styles.caption}>Offline cinematic subtitle creation</Text>
    </Animated.View>
  );
}

function SplashParticle({
  left,
  top,
  drift,
  distance,
  delay,
  particleProgress,
}: {
  left: number;
  top: number;
  drift: number;
  distance: number;
  delay: number;
  particleProgress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, particleProgress.value - delay / 1000);
    return {
      opacity: interpolate(progress, [0, 0.3, 1], [0, 0.9, 0]),
      transform: [
        { translateX: drift * progress },
        { translateY: distance * progress },
        { scale: interpolate(progress, [0, 1], [1, 0.2]) },
      ],
    };
  });

  return <Animated.View style={[styles.particle, { left, top }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.canvas,
    zIndex: 20,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logo: {
    color: palette.textPrimary,
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 240, 255, 0.24)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  logoGlow: {
    marginTop: 14,
    width: 124,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    shadowColor: palette.cyan,
    shadowOpacity: 0.85,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  caption: {
    position: 'absolute',
    bottom: 112,
    color: palette.textSecondary,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: palette.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
});
