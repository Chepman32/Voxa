import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { haptics } from '../../services/haptics';
import { useAppStore } from '../../store/app-store';
import {
  palette,
  springConfig,
  subtitleFontOptions,
  subtitleHighlightColorOptions,
} from '../../theme/tokens';
import type { SubtitleEffect, SubtitleStyle } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface AppDemoScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
}

const SAMPLE_TEXT = "This is how your captions will look";

const FONTS = subtitleFontOptions.slice(0, 4);
const COLORS = subtitleHighlightColorOptions;
const EFFECTS: Array<{ id: SubtitleEffect; label: string }> = [
  { id: 'none', label: 'Clean' },
  { id: 'neon', label: 'Neon' },
  { id: 'glow', label: 'Glow' },
  { id: 'shadow', label: 'Cinema' },
];

function getEffectStyle(effect: SubtitleEffect | undefined, accentColor: string): any {
  switch (effect) {
    case 'neon':
      return {
        textShadowColor: accentColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
      };
    case 'chrome':
      return {
        textShadowColor: '#ffffff',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      };
    case 'glow':
      return {
        textShadowColor: accentColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
      };
    case 'shadow':
      return {
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 4, height: 4 },
        textShadowRadius: 2,
      };
    default:
      return {};
  }
}

export function AppDemoScreen({
  onNext,
  onBack,
  onSkip,
  progress,
}: AppDemoScreenProps) {
  const insets = useSafeAreaInsets();
  const onboardingAnswers = useAppStore(state => state.onboardingAnswers);

  const [selectedFont, setSelectedFont] = useState(
    onboardingAnswers.preferences.fontPreset ?? FONTS[0].id,
  );
  const [selectedColor, setSelectedColor] = useState(
    onboardingAnswers.preferences.stylePreset ?? COLORS[0].id,
  );
  const [selectedEffect, setSelectedEffect] = useState<SubtitleEffect>(
    (onboardingAnswers.preferences.effect as SubtitleEffect) ?? 'none',
  );

  const playhead = useSharedValue(0);
  const previewScale = useSharedValue(0.9);
  const previewOpacity = useSharedValue(0);

  useEffect(() => {
    previewScale.value = withDelay(200, withSpring(1, springConfig));
    previewOpacity.value = withDelay(200, withSpring(1, springConfig));
    playhead.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      true,
    );
  }, [playhead, previewOpacity, previewScale]);

  const previewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ scale: previewScale.value }],
  }));

  const font = FONTS.find(f => f.id === selectedFont) ?? FONTS[0];
  const color = COLORS.find(c => c.id === selectedColor) ?? COLORS[0];

  const words = SAMPLE_TEXT.split(' ');
  const activeIndex = Math.floor(
    interpolate(playhead.value, [0, 1], [0, words.length - 1]),
  );

  const handleFont = (id: string) => {
    haptics.light();
    setSelectedFont(id);
  };

  const handleColor = (id: string) => {
    haptics.light();
    setSelectedColor(id);
  };

  const handleEffect = (id: SubtitleEffect) => {
    haptics.light();
    setSelectedEffect(id);
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>Try it now</Text>
        <Text style={styles.subheadline}>
          Pick a font, color, and effect. See your style come alive in real time.
        </Text>

        <Animated.View style={[styles.previewWrap, previewStyle]}>
          <View style={styles.videoMock}>
            <View style={styles.videoOverlay} />
            <View style={styles.subtitleBar}>
              <Text
                style={[
                  styles.subtitleText,
                  {
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight as any,
                  },
                  getEffectStyle(selectedEffect, color.accentColor),
                ]}>
                {words.map((word, i) => (
                  <Text
                    key={i}
                    style={
                      i === activeIndex
                        ? { color: color.accentColor }
                        : { color: '#FFFFFF' }
                    }>
                    {i > 0 ? ' ' : ''}
                    {word}
                  </Text>
                ))}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          <Text style={styles.sectionLabel}>Font</Text>
          <View style={styles.fontRow}>
            {FONTS.map(f => {
              const isSelected = selectedFont === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => handleFont(f.id)}
                  style={[
                    styles.fontChip,
                    isSelected && styles.chipSelected,
                  ]}>
                  <Text
                    style={[
                      styles.fontChipText,
                      { fontFamily: f.fontFamily, fontWeight: f.fontWeight as any },
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Accent</Text>
          <View style={styles.colorRow}>
            {COLORS.map(c => {
              const isSelected = selectedColor === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleColor(c.id)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.accentColor },
                    isSelected && styles.colorCircleSelected,
                  ]}>
                  {isSelected && (
                    <View style={styles.colorCheck} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Effect</Text>
          <View style={styles.effectRow}>
            {EFFECTS.map(e => {
              const isSelected = selectedEffect === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => handleEffect(e.id)}
                  style={[
                    styles.effectChip,
                    isSelected && styles.chipSelected,
                  ]}>
                  <Text
                    style={[
                      styles.effectChipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {e.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable
          onPress={() => {
            haptics.medium();
            onNext();
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>I love this look</Text>
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
    marginBottom: 20,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  videoMock: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  subtitleBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  controls: {
    gap: 4,
  },
  sectionLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  fontRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  fontChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  chipSelected: {
    borderColor: 'rgba(0, 240, 255, 0.4)',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  chipTextSelected: {
    color: palette.cyan,
    fontWeight: '700',
  },
  fontChipText: {
    color: palette.textPrimary,
    fontSize: 13,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: palette.textPrimary,
  },
  colorCheck: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.textPrimary,
    position: 'absolute',
    top: 3,
    right: 3,
  },
  effectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  effectChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  effectChipText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
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
