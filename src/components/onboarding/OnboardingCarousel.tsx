import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { onboardingCards, palette, springConfig } from '../../theme/tokens';
import type { PermissionSummary } from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { GlassPanel } from '../common/GlassPanel';

interface OnboardingCarouselProps {
  pending: boolean;
  permissionSummary: PermissionSummary | null;
  onGrantAccess: () => Promise<void>;
  onSkip: () => void;
}

export function OnboardingCarousel({
  pending,
  permissionSummary,
  onGrantAccess,
  onSkip,
}: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const lift = useSharedValue(0);
  const listRef = useRef<FlatList<(typeof onboardingCards)[number]>>(null);
  const permissionCardIndex = onboardingCards.findIndex(
    card => card.kind === 'permissions',
  );
  const ctaCardIndex = onboardingCards.findIndex(card => card.kind === 'cta');

  const triggerGrantAccess = async () => {
    if (pending || currentIndex !== permissionCardIndex) {
      return;
    }

    haptics.medium();
    await onGrantAccess();

    if (permissionCardIndex < onboardingCards.length - 1) {
      listRef.current?.scrollToIndex({
        animated: true,
        index: permissionCardIndex + 1,
      });
    }
  };

  const swipeUpGesture = Gesture.Pan()
    .enabled(currentIndex === permissionCardIndex && !pending)
    .activeOffsetY(-12)
    .failOffsetX([-8, 8])
    .onUpdate(event => {
      lift.value = Math.max(0, -event.translationY);
    })
    .onEnd(event => {
      const shouldTrigger = event.translationY < -72;
      lift.value = withSpring(0, springConfig);
      if (!shouldTrigger) {
        return;
      }
      runOnJS(triggerGrantAccess)();
    });

  const promptStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(lift.value, 70) * 0.28 }],
    opacity: interpolate(lift.value, [0, 90], [1, 0.4]),
  }));

  return (
    <View style={styles.root}>
      <AtmosphereCanvas intensity={1.06} />
      <FlatList
        ref={listRef}
        data={onboardingCards}
        horizontal
        keyExtractor={item => item.id}
        onMomentumScrollEnd={event => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(nextIndex);
        }}
        pagingEnabled
        renderItem={({ item, index }: ListRenderItemInfo<(typeof onboardingCards)[number]>) => {
          const isPermissionCard = item.kind === 'permissions';
          const isCtaCard = item.kind === 'cta';

          const cardBody = (
            <>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>

              {isPermissionCard ? (
                <GestureDetector gesture={swipeUpGesture}>
                  <Animated.View style={[styles.permissionPanel, promptStyle]}>
                    <View style={styles.permissionHeader}>
                      <Feather color={palette.cyan} name="shield" size={18} />
                      <Text style={styles.permissionTitle}>
                        Swipe up to grant access
                      </Text>
                    </View>

                    {pending ? (
                      <View style={styles.permissionLoading}>
                        <ActivityIndicator color={palette.cyan} />
                        <Text style={styles.permissionBody}>
                          Requesting iOS permissions...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.permissionBody}>
                        Pull this card upward to request Photos and Speech permissions.
                      </Text>
                    )}

                    {permissionSummary ? (
                      <View style={styles.permissionSummary}>
                        <PermissionRow label="Library" value={permissionSummary.photoLibrary} />
                        <PermissionRow label="Speech" value={permissionSummary.speech} />
                      </View>
                    ) : null}
                  </Animated.View>
                </GestureDetector>
              ) : isCtaCard ? (
                <Pressable
                  onPress={onSkip}
                  style={styles.primaryButton}
                  testID="onboarding-get-started-button">
                  <Text style={styles.primaryButtonText}>
                    {item.ctaLabel ?? 'Get Started'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {}}
                  style={styles.progressHint}
                  testID={`onboarding-card-${index}`}>
                  <Feather color={palette.textSecondary} name="arrow-right" size={16} />
                  <Text style={styles.progressText}>Swipe to continue</Text>
                </Pressable>
              )}
            </>
          );

          return (
            <View style={[styles.page, { width }]}>
              <ImageBackground
                blurRadius={isPermissionCard ? 16 : 12}
                source={{ uri: item.image }}
                style={styles.image}>
                <View style={styles.imageOverlay} />

                <GlassPanel
                  style={[
                    styles.card,
                    { marginBottom: insets.bottom + 28 },
                  ]}>
                  {cardBody}
                </GlassPanel>
              </ImageBackground>
            </View>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />

      {currentIndex !== ctaCardIndex ? (
        <Pressable
          onPress={onSkip}
          style={[
            styles.skipButton,
            styles.skipButtonFloating,
            { top: insets.top + 12 },
          ]}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}

      {currentIndex !== ctaCardIndex ? (
        <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>
          <View style={styles.pagination}>
            {onboardingCards.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : undefined,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PermissionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.permissionRow}>
      <Text style={styles.permissionLabel}>{label}</Text>
      <Text style={styles.permissionValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  page: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  card: {
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
    gap: 16,
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  description: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  progressHint: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    minHeight: 54,
    marginTop: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  primaryButtonText: {
    color: palette.canvas,
    fontSize: 15,
    fontWeight: '800',
  },
  progressText: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionPanel: {
    marginTop: 10,
    padding: 18,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(6, 9, 13, 0.72)',
    gap: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  permissionBody: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  permissionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionSummary: {
    marginTop: 4,
    gap: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionLabel: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  permissionValue: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  skipButton: {
    position: 'absolute',
    left: 20,
    zIndex: 2,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 12, 18, 0.42)',
  },
  skipButtonFloating: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dotActive: {
    width: 28,
    backgroundColor: palette.cyan,
  },
});
