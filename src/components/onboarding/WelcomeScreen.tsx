import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../i18n/useTranslation';
import { haptics } from '../../services/haptics';
import { palette, springConfig } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip: () => void;
  progress: number;
}

export function WelcomeScreen({ onNext, onSkip, progress }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const titleY = useSharedValue(40);
  const titleOpacity = useSharedValue(0);
  const descY = useSharedValue(30);
  const descOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);
  const previewScale = useSharedValue(0.85);
  const previewOpacity = useSharedValue(0);

  useEffect(() => {
    previewScale.value = withDelay(100, withSpring(1, springConfig));
    previewOpacity.value = withDelay(100, withSpring(1, springConfig));
    titleY.value = withDelay(280, withSpring(0, springConfig));
    titleOpacity.value = withDelay(280, withSpring(1, springConfig));
    descY.value = withDelay(420, withSpring(0, springConfig));
    descOpacity.value = withDelay(420, withSpring(1, springConfig));
    ctaY.value = withDelay(580, withSpring(0, springConfig));
    ctaOpacity.value = withDelay(580, withSpring(1, springConfig));
  }, [ctaOpacity, ctaY, descOpacity, descY, previewOpacity, previewScale, titleOpacity, titleY]);

  const previewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ scale: previewScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onSkip={onSkip} showBack={false} />

      <View style={styles.content}>
        <Animated.View style={[styles.previewWrap, previewStyle]}>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneScreen}>
              <View style={styles.mockSubtitleBar}>
                <View style={styles.mockWord} />
                <View style={[styles.mockWord, styles.mockWordShort]} />
                <View style={styles.mockWord} />
              </View>
              <View style={styles.mockTimeline}>
                <View style={styles.mockBlock} />
                <View style={[styles.mockBlock, styles.mockBlockShort]} />
              </View>
            </View>
          </View>
          <View style={styles.glowOrb} />
        </Animated.View>

        <Animated.View style={[styles.textWrap, titleStyle]}>
          <Text style={styles.eyebrow}>{t('welcomeEyebrow')}</Text>
          <Text style={styles.title}>
            {t('welcomeTitle')}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textWrap, descStyle]}>
          <Text style={styles.description}>
            {t('welcomeDescription')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          ctaStyle,
          { paddingBottom: insets.bottom + 28 },
        ]}>
        <Pressable
          onPress={() => {
            haptics.medium();
            onNext();
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{t('welcomeCta')}</Text>
        </Pressable>
      </Animated.View>
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
    gap: 24,
  },
  previewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  phoneFrame: {
    width: 180,
    height: 280,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(10, 12, 18, 0.72)',
    padding: 10,
    shadowColor: palette.cyan,
    shadowOpacity: 0.15,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 8 },
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
    gap: 10,
  },
  mockSubtitleBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  mockWord: {
    height: 10,
    width: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  mockWordShort: {
    width: 28,
    backgroundColor: palette.cyan,
  },
  mockTimeline: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 8,
  },
  mockBlock: {
    height: 18,
    width: 60,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.35)',
  },
  mockBlockShort: {
    width: 36,
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    top: 20,
    zIndex: -1,
  },
  textWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 28,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 16,
    fontWeight: '800',
  },
});
