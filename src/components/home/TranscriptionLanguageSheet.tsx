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

import { APP_LANGUAGE_LOCALE_VALUE } from '../../lib/speech-locale';
import { useTranslation } from '../../i18n/useTranslation';
import { palette } from '../../theme/tokens';
import type { SpeechLocaleOption } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';

interface TranscriptionLanguageSheetProps {
  visible: boolean;
  loading: boolean;
  appLanguageLabel: string;
  localeOptions: SpeechLocaleOption[];
  selectedLocale: string;
  onClose: () => void;
  onConfirm: () => void;
  onSelectLocale: (locale: string) => void;
}

export function TranscriptionLanguageSheet({
  visible,
  loading,
  appLanguageLabel,
  localeOptions,
  selectedLocale,
  onClose,
  onConfirm,
  onSelectLocale,
}: TranscriptionLanguageSheetProps) {
  const { t } = useTranslation();
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
    <View pointerEvents="auto" style={styles.root}>
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
              <Text style={styles.title}>{t('transcribingLanguageTitle')}</Text>
              <Text style={styles.body}>{t('transcribingLanguageBody')}</Text>
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
              active={selectedLocale === APP_LANGUAGE_LOCALE_VALUE}
              label={appLanguageLabel}
              onPress={() => onSelectLocale(APP_LANGUAGE_LOCALE_VALUE)}
            />

            {localeOptions.map(option => (
              <LocaleOptionRow
                key={option.value}
                active={selectedLocale === option.value}
                label={option.label}
                onPress={() => onSelectLocale(option.value)}
              />
            ))}
          </ScrollView>

          <Text style={styles.footnote}>
            {loading
              ? t('loadingOnDeviceLanguages')
              : localeOptions.length > 0
              ? `${localeOptions.length} ${t('onDeviceLanguagesAvailable')}`
              : t('noOnDeviceLanguages')}
          </Text>

          <Pressable
            disabled={loading}
            onPress={onConfirm}
            style={[styles.confirmButton, loading && styles.buttonDisabled]}>
            <Text style={styles.confirmButtonText}>
              {loading ? t('loading') : t('transcribeVideo')}
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
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.localeRow, active ? styles.localeRowActive : undefined]}>
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
    zIndex: 20,
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
    maxHeight: 520,
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
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  localeRowActive: {
    borderColor: 'rgba(0, 240, 255, 0.34)',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
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
    lineHeight: 17,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: palette.canvas,
    fontSize: 15,
    fontWeight: '800',
  },
});
