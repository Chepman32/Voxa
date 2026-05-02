import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useTranslation } from '../../i18n/useTranslation';
import { haptics } from '../../services/haptics';
import { palette, springConfig } from '../../theme/tokens';
import { OnboardingHeader } from './OnboardingHeader';

interface PainPointsScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
  onSelectPainPoints: (painPoints: string[]) => void;
}

function usePainPoints(t: (key: string) => string) {
  return [
    { id: 'typing', label: t('painTyping') },
    { id: 'tools', label: t('painTools') },
    { id: 'cost', label: t('painCost') },
    { id: 'timing', label: t('painTiming') },
    { id: 'style', label: t('painStyle') },
    { id: 'offline', label: t('painOffline') },
    { id: 'privacy', label: t('painPrivacy') },
  ];
}

export function PainPointsScreen({
  onNext,
  onBack,
  onSkip,
  progress,
  onSelectPainPoints,
}: PainPointsScreenProps) {
  const { t } = useTranslation();
  const PAIN_POINTS = usePainPoints(t);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const buttonScale = useSharedValue(1);

  const toggle = (id: string) => {
    haptics.light();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectPainPoints(Array.from(next));
      return next;
    });
    buttonScale.value = withSpring(1, springConfig);
  };

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>{t('painHeadline')}</Text>
        <Text style={styles.subheadline}>
          {t('painSubheadline')}
        </Text>

        <View style={styles.options}>
          {PAIN_POINTS.map(pain => {
            const isSelected = selected.has(pain.id);
            return (
              <Pressable key={pain.id} onPress={() => toggle(pain.id)}>
                <View
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                    {isSelected && (
                      <Feather color={palette.canvas} name="check" size={14} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                    {pain.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={ctaStyle}>
          <Pressable
            disabled={selected.size === 0}
            onPress={() => {
              haptics.medium();
              onNext();
            }}
            style={[
              styles.primaryButton,
              selected.size === 0 && styles.primaryButtonDisabled,
            ]}>
            <Text style={styles.primaryButtonText}>
              {selected.size === 0
                ? t('painCtaNone')
                : `${t('continue')} (${selected.size})`}
            </Text>
          </Pressable>
        </Animated.View>
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
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  headline: {
    color: palette.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheadline: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  optionSelected: {
    borderColor: 'rgba(0, 240, 255, 0.35)',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: palette.cyan,
    backgroundColor: palette.cyan,
  },
  optionLabel: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 16,
    fontWeight: '800',
  },
});
