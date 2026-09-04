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

interface GoalQuestionScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
  onSelectGoal: (goal: string) => void;
}

function useGoals(t: (key: string) => string) {
  return [
    { id: 'viral', label: t('goalViral'), icon: 'trending-up' },
    { id: 'accessible', label: t('goalAccessible'), icon: 'users' },
    { id: 'brand', label: t('goalBrand'), icon: 'aperture' },
    { id: 'fast', label: t('goalFast'), icon: 'zap' },
    { id: 'multilingual', label: t('goalMultilingual'), icon: 'globe' },
    { id: 'professional', label: t('goalProfessional'), icon: 'award' },
  ];
}

export function GoalQuestionScreen({
  onNext,
  onBack,
  onSkip,
  progress,
  onSelectGoal,
}: GoalQuestionScreenProps) {
  const { t } = useTranslation();
  const GOALS = useGoals(t);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const buttonScale = useSharedValue(1);

  const handleSelect = (id: string) => {
    haptics.medium();
    setSelected(id);
    onSelectGoal(id);
    buttonScale.value = withSpring(1, springConfig);
  };

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>{t('goalHeadline')}</Text>
        <Text style={styles.subheadline}>{t('goalSubheadline')}</Text>

        <View style={styles.options}>
          {GOALS.map(goal => {
            const isSelected = selected === goal.id;
            return (
              <Pressable key={goal.id} onPress={() => handleSelect(goal.id)}>
                <Animated.View
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <Feather
                    color={isSelected ? palette.cyan : palette.textSecondary}
                    name={goal.icon as any}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {goal.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.check}>
                      <Feather color={palette.cyan} name="check" size={16} />
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={ctaStyle}>
          <Pressable
            disabled={!selected}
            onPress={() => {
              haptics.medium();
              onNext();
            }}
            style={[
              styles.primaryButton,
              !selected && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>{t('goalCta')}</Text>
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
  optionLabel: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: palette.cyan,
    fontWeight: '700',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
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
