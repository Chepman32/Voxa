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
import { palette, springConfig } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface SocialProofScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
}

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Maya K.',
    tag: 'TikTok Creator',
    text: 'I used to spend 45 minutes on captions for every video. Now it is literally under a minute. The neon style gets me so many comments.',
    stars: 5,
  },
  {
    id: '2',
    name: 'Jordan T.',
    tag: 'YouTuber',
    text: 'Finally an app that does not upload my raw footage somewhere. Everything stays on my phone and the quality is unreal.',
    stars: 5,
  },
  {
    id: '3',
    name: 'Sofia R.',
    tag: 'Brand Manager',
    text: 'We batch-create Reels for three brands. Voxa cut our subtitle workflow by 80%. The gesture editing feels like magic.',
    stars: 5,
  },
];

export function SocialProofScreen({
  onNext,
  onBack,
  onSkip,
  progress,
}: SocialProofScreenProps) {
  const insets = useSafeAreaInsets();
  const card1Y = useSharedValue(30);
  const card1Opacity = useSharedValue(0);
  const card2Y = useSharedValue(30);
  const card2Opacity = useSharedValue(0);
  const card3Y = useSharedValue(30);
  const card3Opacity = useSharedValue(0);

  useEffect(() => {
    card1Y.value = withDelay(100, withSpring(0, springConfig));
    card1Opacity.value = withDelay(100, withSpring(1, springConfig));
    card2Y.value = withDelay(220, withSpring(0, springConfig));
    card2Opacity.value = withDelay(220, withSpring(1, springConfig));
    card3Y.value = withDelay(340, withSpring(0, springConfig));
    card3Opacity.value = withDelay(340, withSpring(1, springConfig));
  }, [card1Opacity, card1Y, card2Opacity, card2Y, card3Opacity, card3Y]);

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));
  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateY: card3Y.value }],
  }));

  const cardStyles = [card1Style, card2Style, card3Style];

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>Creators like you are already saving hours</Text>
        <Text style={styles.subheadline}>
          Join thousands who ditched manual captioning for good.
        </Text>

        <View style={styles.cards}>
          {TESTIMONIALS.map((t, i) => (
            <Animated.View key={t.id} style={cardStyles[i]}>
              <GlassPanel style={styles.card} blurAmount={18}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {t.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.name}>{t.name}</Text>
                    <Text style={styles.tag}>{t.tag}</Text>
                  </View>
                  <View style={styles.stars}>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Feather
                        key={si}
                        color={palette.amber}
                        name="star"
                        size={12}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.quote}>"{t.text}"</Text>
              </GlassPanel>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable
          onPress={() => {
            haptics.medium();
            onNext();
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
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
  cards: {
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: palette.cyan,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
  },
  name: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tag: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
  },
  quote: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
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
