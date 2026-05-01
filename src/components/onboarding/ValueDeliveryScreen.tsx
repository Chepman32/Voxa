import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { useAppStore } from '../../store/app-store';
import { palette, springConfig } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface ValueDeliveryScreenProps {
  onComplete: () => void;
  onBack: () => void;
  progress: number;
}

export function ValueDeliveryScreen({
  onComplete,
  onBack,
  progress,
}: ValueDeliveryScreenProps) {
  const insets = useSafeAreaInsets();
  const onboardingAnswers = useAppStore(state => state.onboardingAnswers);

  const cardY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);
  const itemsY = useSharedValue(30);
  const itemsOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    cardY.value = withDelay(200, withSpring(0, springConfig));
    cardOpacity.value = withDelay(200, withSpring(1, springConfig));
    itemsY.value = withDelay(500, withSpring(0, springConfig));
    itemsOpacity.value = withDelay(500, withSpring(1, springConfig));
    ctaY.value = withDelay(800, withSpring(0, springConfig));
    ctaOpacity.value = withDelay(800, withSpring(1, springConfig));
  }, [cardOpacity, cardY, ctaOpacity, ctaY, itemsOpacity, itemsY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const itemsStyle = useAnimatedStyle(() => ({
    opacity: itemsOpacity.value,
    transform: [{ translateY: itemsY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const goalLabels: Record<string, string> = {
    viral: 'Go viral with better retention',
    accessible: 'Make content accessible',
    brand: 'Build a consistent brand look',
    fast: 'Post faster without outsourcing',
    multilingual: 'Reach non-English audiences',
    professional: 'Look more professional',
  };

  const goal = onboardingAnswers.goal;
  const goalLabel = goal ? goalLabels[goal] ?? 'Create amazing subtitles' : 'Create amazing subtitles';

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} showSkip={false} />

      <View style={styles.content}>
        <Animated.View style={[styles.card, cardStyle]}>
          <GlassPanel style={styles.cardInner} blurAmount={20}>
            <View style={styles.checkWrap}>
              <View style={styles.checkCircle}>
                <Feather color={palette.canvas} name="check" size={28} />
              </View>
            </View>
            <Text style={styles.cardTitle}>You are all set</Text>
            <Text style={styles.cardBody}>
              We have customized Voxa to help you{"\n"}
              <Text style={styles.cardHighlight}>{goalLabel}</Text>.
            </Text>
          </GlassPanel>
        </Animated.View>

        <Animated.View style={[styles.itemsWrap, itemsStyle]}>
          <Text style={styles.itemsTitle}>What is ready for you:</Text>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="zap" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>One-tap subtitle generation</Text>
              <Text style={styles.itemDesc}>Import a video and get captions in seconds</Text>
            </View>
          </View>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="sliders" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>Your signature style saved</Text>
              <Text style={styles.itemDesc}>Default font, color, and effect pre-selected</Text>
            </View>
          </View>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="shield" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>Private by default</Text>
              <Text style={styles.itemDesc}>Everything processed on your device</Text>
            </View>
          </View>
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
            haptics.success();
            onComplete();
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Creating</Text>
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
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  card: {
    marginBottom: 28,
  },
  cardInner: {
    padding: 28,
    borderRadius: 26,
    alignItems: 'center',
  },
  checkWrap: {
    marginBottom: 18,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.success,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardBody: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  cardHighlight: {
    color: palette.cyan,
    fontWeight: '700',
  },
  itemsWrap: {
    gap: 16,
  },
  itemsTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemDesc: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 16,
    fontWeight: '800',
  },
});
