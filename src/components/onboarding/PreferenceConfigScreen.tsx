import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../i18n/useTranslation';
import { haptics } from '../../services/haptics';
import {
  palette,
  springConfig,
  subtitleFontOptions,
  subtitleHighlightColorOptions,
} from '../../theme/tokens';
import type { SubtitleEffect } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';
import { OnboardingHeader } from './OnboardingHeader';

interface PreferenceConfigScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
  onSelectPreferences: (prefs: {
    stylePreset: string | null;
    fontPreset: string | null;
    effect: string | null;
  }) => void;
}

const FONTS = subtitleFontOptions.slice(0, 4).map(f => ({
  id: f.id,
  label: f.label,
  fontFamily: f.fontFamily,
  fontWeight: f.fontWeight,
}));

const COLORS = subtitleHighlightColorOptions.map(c => ({
  id: c.id,
  label: c.label,
  color: c.accentColor,
}));

function useEffects(t: (key: string) => string): Array<{ id: SubtitleEffect; label: string }> {
  return [
    { id: 'none', label: t('effectClean') },
    { id: 'neon', label: t('effectNeon') },
    { id: 'glow', label: t('effectGlow') },
    { id: 'shadow', label: t('effectCinema') },
  ];
}

export function PreferenceConfigScreen({
  onNext,
  onBack,
  onSkip,
  progress,
  onSelectPreferences,
}: PreferenceConfigScreenProps) {
  const { t } = useTranslation();
  const EFFECTS = useEffects(t);
  const insets = useSafeAreaInsets();
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const buttonScale = useSharedValue(1);

  const previewText = t('demoPreviewText');

  const handleNext = () => {
    haptics.medium();
    onSelectPreferences({
      stylePreset: selectedColor,
      fontPreset: selectedFont,
      effect: selectedEffect,
    });
    onNext();
  };

  const getEffectStyle = (): any => {
    switch (selectedEffect) {
      case 'neon':
        return {
          textShadowColor: selectedColor ? COLORS.find(c => c.id === selectedColor)?.color ?? palette.cyan : palette.cyan,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 18,
        };
      case 'glow':
        return {
          textShadowColor: selectedColor ? COLORS.find(c => c.id === selectedColor)?.color ?? palette.amber : palette.amber,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 14,
        };
      case 'shadow':
        return {
          textShadowColor: 'rgba(0, 0, 0, 0.9)',
          textShadowOffset: { width: 3, height: 3 },
          textShadowRadius: 2,
        };
      default:
        return {};
    }
  };

  const previewColor = selectedColor
    ? COLORS.find(c => c.id === selectedColor)?.color ?? palette.textPrimary
    : palette.textPrimary;

  const previewFont = selectedFont
    ? FONTS.find(f => f.id === selectedFont)
    : null;

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.root}>
      <OnboardingHeader progress={progress} onBack={onBack} onSkip={onSkip} />

      <View style={styles.content}>
        <Text style={styles.headline}>{t('prefHeadline')}</Text>
        <Text style={styles.subheadline}>
          {t('prefSubheadline')}
        </Text>

        <GlassPanel style={styles.previewCard} blurAmount={20}>
          <Text
            style={[
              styles.previewText,
              {
                color: previewColor,
                fontFamily: previewFont?.fontFamily,
                fontWeight: previewFont?.fontWeight as any,
              },
              getEffectStyle(),
            ]}>
            {previewText}
          </Text>
        </GlassPanel>

        <Text style={styles.sectionLabel}>{t('prefSectionFont')}</Text>
        <View style={styles.grid}>
          {FONTS.map(font => {
            const isSelected = selectedFont === font.id;
            return (
              <Pressable
                key={font.id}
                onPress={() => {
                  haptics.light();
                  setSelectedFont(font.id);
                }}
                style={[
                  styles.gridItem,
                  isSelected && styles.gridItemSelected,
                ]}>
                <Text
                  style={[
                    styles.gridItemText,
                    { fontFamily: font.fontFamily, fontWeight: font.fontWeight as any },
                    isSelected && styles.gridItemTextSelected,
                  ]}>
                  {font.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t('prefSectionColor')}</Text>
        <View style={styles.colorRow}>
          {COLORS.map(color => {
            const isSelected = selectedColor === color.id;
            return (
              <Pressable
                key={color.id}
                onPress={() => {
                  haptics.light();
                  setSelectedColor(color.id);
                }}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color.color },
                  isSelected && styles.colorCircleSelected,
                ]}>
                {isSelected && (
                  <View style={styles.colorCheck} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t('prefSectionEffect')}</Text>
        <View style={styles.grid}>
          {EFFECTS.map(effect => {
            const isSelected = selectedEffect === effect.id;
            return (
              <Pressable
                key={effect.id}
                onPress={() => {
                  haptics.light();
                  setSelectedEffect(effect.id);
                }}
                style={[
                  styles.gridItem,
                  isSelected && styles.gridItemSelected,
                ]}>
                <Text
                  style={[
                    styles.gridItemText,
                    isSelected && styles.gridItemTextSelected,
                  ]}>
                  {effect.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={ctaStyle}>
          <Pressable
            onPress={handleNext}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{t('prefCta')}</Text>
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
    marginBottom: 20,
  },
  previewCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  gridItemSelected: {
    borderColor: 'rgba(0, 240, 255, 0.4)',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  gridItemText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  gridItemTextSelected: {
    color: palette.cyan,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.textPrimary,
    position: 'absolute',
    top: 4,
    right: 4,
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
