import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import {
  exportResolutions,
  palette,
  speechLocales,
  springConfig,
} from '../../theme/tokens';
import type { ExportResolution } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';

interface SettingsSheetProps {
  visible: boolean;
  speechLocale: string;
  preferredExportResolution: ExportResolution;
  onClose: () => void;
  onSpeechLocaleChange: (locale: string) => void;
  onResolutionChange: (resolution: ExportResolution) => void;
  onResetOnboarding: () => void;
}

export function SettingsSheet({
  visible,
  speechLocale,
  preferredExportResolution,
  onClose,
  onSpeechLocaleChange,
  onResolutionChange,
  onResetOnboarding,
}: SettingsSheetProps) {
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 260 });
    if (!visible) {
      dragY.value = 0;
    }
  }, [dragY, progress, visible]);

  const closeSheet = () => {
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd(event => {
      const shouldClose = event.translationY > 120;
      if (shouldClose) {
        runOnJS(closeSheet)();
        return;
      }
      dragY.value = withSpring(0, springConfig);
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          interpolate(progress.value, [0, 1], [620, 0]) + dragY.value,
      },
    ],
    opacity: progress.value,
  }));

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheetWrap, sheetStyle]}>
          <GlassPanel style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather color={palette.textSecondary} name="x" size={18} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Speech Locale</Text>
              <View style={styles.pillRow}>
                {speechLocales.map(locale => (
                  <Pressable
                    key={locale.value}
                    onPress={() => onSpeechLocaleChange(locale.value)}
                    style={[
                      styles.pill,
                      speechLocale === locale.value ? styles.pillActive : undefined,
                    ]}>
                    <Text
                      style={[
                        styles.pillText,
                        speechLocale === locale.value ? styles.pillTextActive : undefined,
                      ]}>
                      {locale.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Default Export</Text>
              <View style={styles.pillRow}>
                {exportResolutions.map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() => onResolutionChange(option.value)}
                    style={[
                      styles.pill,
                      preferredExportResolution === option.value
                        ? styles.pillActive
                        : undefined,
                    ]}>
                    <Text
                      style={[
                        styles.pillText,
                        preferredExportResolution === option.value
                          ? styles.pillTextActive
                          : undefined,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Privacy</Text>
              <Text style={styles.bodyText}>
                Voxa keeps extraction, speech recognition, subtitle editing, and
                export entirely on-device. Remote media is only used for visual
                placeholders.
              </Text>
            </View>

            <Pressable onPress={onResetOnboarding} style={styles.resetRow}>
              <Feather color={palette.cyan} name="refresh-ccw" size={16} />
              <Text style={styles.resetText}>Replay onboarding</Text>
            </Pressable>
          </GlassPanel>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheetWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 22,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  pillActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  pillText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: palette.textPrimary,
  },
  bodyText: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetText: {
    color: palette.cyan,
    fontSize: 14,
    fontWeight: '700',
  },
});
