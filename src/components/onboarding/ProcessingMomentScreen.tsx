import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useTranslation } from '../../i18n/useTranslation';
import { palette } from '../../theme/tokens';
import { OnboardingHeader } from './OnboardingHeader';

interface ProcessingMomentScreenProps {
  onComplete: () => void;
  progress: number;
}

function usePhases(t: (key: string) => string) {
  return [
    { label: t('procPhase1'), icon: 'sliders' as const },
    { label: t('procPhase2'), icon: 'layout' as const },
    { label: t('procPhase3'), icon: 'check-circle' as const },
  ];
}

export function ProcessingMomentScreen({
  onComplete,
  progress,
}: ProcessingMomentScreenProps) {
  const { t } = useTranslation();
  const phases = usePhases(t);
  const phaseCount = phases.length;
  const insets = useSafeAreaInsets();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    const phaseTimer = setInterval(() => {
      setPhaseIndex(current => (current + 1) % phaseCount);
    }, 900);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearInterval(phaseTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, phaseCount, pulse, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} showBack={false} showSkip={false} />

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={[styles.spinnerRing, ringStyle]}>
            <View style={styles.spinnerTrack} />
            <View style={styles.spinnerHead} />
          </Animated.View>
          <View style={styles.centerIcon}>
            <Feather color={palette.cyan} name="cpu" size={32} />
          </View>
        </View>

        <Text style={styles.title}>{t('procTitle')}</Text>
        <Text style={styles.subtitle}>{phases[phaseIndex]?.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  ringWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
  },
  spinnerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  spinnerTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  spinnerHead: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.cyan,
    shadowColor: palette.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 240, 255, 0.15)',
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
