import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { palette } from '../../theme/tokens';
import type { SpeechLocaleOption } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';

export const LOCALE_RETRY_SHEET_ID = 'locale-retry-sheet';
export const LOCALE_RETRY_BUTTON_ID = 'locale-retry-button';
export const LOCALE_RETRY_OPTION_TEST_ID_PREFIX = 'locale-retry-option';
export const AUTO_DETECT_LOCALE_VALUE = '__auto_detect__';

interface LocaleRetrySheetProps {
  visible: boolean;
  loading: boolean;
  retrying: boolean;
  localeOptions: SpeechLocaleOption[];
  selectedLocale: string;
  onClose: () => void;
  onRetry: () => void;
  onSelectLocale: (locale: string) => void;
}

export function LocaleRetrySheet({
  visible,
  loading,
  retrying,
  localeOptions,
  selectedLocale,
  onClose,
  onRetry,
  onSelectLocale,
}: LocaleRetrySheetProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [36, 0]),
      },
    ],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.root} testID={LOCALE_RETRY_SHEET_ID}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrap,
          { paddingBottom: Math.max(insets.bottom, 12) },
          sheetStyle,
        ]}>
        <GlassPanel style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Retry Subtitles</Text>
              <Text style={styles.body}>
                Auto Detect picks the best on-device language. Choose a locale manually
                if detection missed the clip.
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather color={palette.textSecondary} name="x" size={18} />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.localeList}
            showsVerticalScrollIndicator={false}>
            <LocaleOptionRow
              active={selectedLocale === AUTO_DETECT_LOCALE_VALUE}
              label="Auto Detect"
              onPress={() => onSelectLocale(AUTO_DETECT_LOCALE_VALUE)}
              testID={`${LOCALE_RETRY_OPTION_TEST_ID_PREFIX}-${AUTO_DETECT_LOCALE_VALUE}`}
            />

            {localeOptions.map(option => (
              <LocaleOptionRow
                key={option.value}
                active={selectedLocale === option.value}
                label={option.label}
                onPress={() => onSelectLocale(option.value)}
                testID={`${LOCALE_RETRY_OPTION_TEST_ID_PREFIX}-${option.value}`}
              />
            ))}
          </ScrollView>

          <Text style={styles.footnote}>
            {loading
              ? 'Loading on-device languages...'
              : localeOptions.length > 0
              ? `${localeOptions.length} on-device languages available on this device.`
              : 'No on-device languages are currently available.'}
          </Text>

          <Pressable
            disabled={loading || retrying || localeOptions.length === 0}
            onPress={onRetry}
            style={[
              styles.retryButton,
              (loading || retrying || localeOptions.length === 0) && styles.buttonDisabled,
            ]}
            testID={LOCALE_RETRY_BUTTON_ID}>
            <Text style={styles.retryButtonText}>
              {retrying ? 'Retrying...' : 'Retry Subtitles'}
            </Text>
          </Pressable>
        </GlassPanel>
      </Animated.View>
    </View>
  );
}

function LocaleOptionRow({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.localeRow, active ? styles.localeRowActive : undefined]}
      testID={testID}>
      <Text style={[styles.localeLabel, active ? styles.localeLabelActive : undefined]}>
        {label}
      </Text>
      {active ? <Feather color={palette.cyan} name="check" size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 22,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheetWrap: {
    paddingHorizontal: 12,
  },
  sheet: {
    maxHeight: 420,
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  localeList: {
    gap: 10,
  },
  localeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  localeRowActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  localeLabel: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  localeLabelActive: {
    color: palette.textPrimary,
  },
  footnote: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  retryButtonText: {
    color: palette.canvas,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
