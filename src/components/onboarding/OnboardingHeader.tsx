import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { palette } from '../../theme/tokens';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface OnboardingHeaderProps {
  progress: number;
  onBack?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showSkip?: boolean;
}

export function OnboardingHeader({
  progress,
  onBack,
  onSkip,
  showBack = true,
  showSkip = true,
}: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {showBack && onBack ? (
          <Pressable
            hitSlop={16}
            onPress={() => {
              haptics.light();
              onBack();
            }}
            style={styles.iconButton}>
            <Feather color={palette.textPrimary} name="arrow-left" size={22} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <View style={styles.progressWrap}>
          <OnboardingProgressBar progress={progress} />
        </View>

        {showSkip && onSkip ? (
          <Pressable
            hitSlop={16}
            onPress={() => {
              haptics.light();
              onSkip();
            }}
            style={styles.skipButton}>
            <Feather color={palette.textSecondary} name="x" size={22} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
  },
  progressWrap: {
    flex: 1,
  },
  skipButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
