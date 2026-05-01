import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { palette, springConfig } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface GoalQuestionScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
  onSelectGoal: (goal: string) => void;
}

const GOALS = [
  { id: 'viral', label: 'Go viral with better retention', icon: 'trending-up' },
  { id: 'accessible', label: 'Make content accessible', icon: 'users' },
  { id: 'brand', label: 'Build a consistent brand look', icon: 'aperture' },
  { id: 'fast', label: 'Post faster without outsourcing', icon: 'zap' },
  { id: 'multilingual', label: 'Reach non-English audiences', icon: 'globe' },
  { id: 'professional', label: 'Look more professional', icon: 'award' },
];

export function GoalQuestionScreen({
  onNext,
  onBack,
  onSkip,
  progress,
  onSelectGoal,
}: GoalQuestionScreenProps) {
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
        <Text style={styles.headline}>What are you trying to achieve?</Text>
        <Text style={styles.subheadline}>
          Pick the one that matters most right now. We will tailor your experience around it.
        </Text>

        <View style={styles.options}>
          {GOALS.map(goal => {
            const isSelected = selected === goal.id;
            return (
              <Pressable
                key={goal.id}
                onPress={() => handleSelect(goal.id)}>
                <Animated.View
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}>
                  <Feather
                    color={isSelected ? palette.cyan : palette.textSecondary}
                    name={goal.icon as any}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
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
            ]}>
            <Text style={styles.primaryButtonText}>Continue</Text>
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
