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

import { useTranslation } from '../../i18n/useTranslation';
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

  const { t } = useTranslation();

  const goalLabels: Record<string, string> = {
    viral: t('goalViral'),
    accessible: t('goalAccessible'),
    brand: t('goalBrand'),
    fast: t('goalFast'),
    multilingual: t('goalMultilingual'),
    professional: t('goalProfessional'),
  };

  const goal = onboardingAnswers.goal;
  const goalLabel = goal ? goalLabels[goal] ?? t('valueGoalFallback') : t('valueGoalFallback');

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
            <Text style={styles.cardTitle}>{t('valueTitle')}</Text>
            <Text style={styles.cardBody}>
              {t('valueBody')}{"\n"}
              <Text style={styles.cardHighlight}>{goalLabel}</Text>.
            </Text>
          </GlassPanel>
        </Animated.View>

        <Animated.View style={[styles.itemsWrap, itemsStyle]}>
          <Text style={styles.itemsTitle}>{t('valueItemsTitle')}</Text>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="zap" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>{t('valueItem1Label')}</Text>
              <Text style={styles.itemDesc}>{t('valueItem1Desc')}</Text>
            </View>
          </View>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="sliders" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>{t('valueItem2Label')}</Text>
              <Text style={styles.itemDesc}>{t('valueItem2Desc')}</Text>
            </View>
          </View>

          <View style={styles.item}>
            <View style={styles.itemIcon}>
              <Feather color={palette.cyan} name="shield" size={16} />
            </View>
            <View>
              <Text style={styles.itemLabel}>{t('valueItem3Label')}</Text>
              <Text style={styles.itemDesc}>{t('valueItem3Desc')}</Text>
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
          <Text style={styles.primaryButtonText}>{t('valueCta')}</Text>
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
    fontSize: 14,
    lineHeight: 20,
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
