import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';

import { palette } from '../../theme/tokens';
import { useTranslation } from '../../i18n/useTranslation';
import type { ProcessingState } from '../../types/models';
import { AtmosphereCanvas } from '../common/AtmosphereCanvas';
import { GlassPanel } from '../common/GlassPanel';

const icons = ['video', 'mic', 'file-text'] as const;

export const PROCESSING_DOWNLOAD_PROGRESS_ID =
  'processing-speech-model-download-progress';
export const PROCESSING_DOWNLOAD_PERCENT_ID =
  'processing-speech-model-download-percent';

export function ProcessingOverlay({
  processing,
}: {
  processing: ProcessingState;
}) {
  const { t } = useTranslation();
  const [iconIndex, setIconIndex] = useState(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!processing.visible) {
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    const timer = setInterval(() => {
      setIconIndex(current => (current + 1) % icons.length);
    }, 720);

    return () => {
      clearInterval(timer);
    };
  }, [processing.visible, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1.06]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
  }));

  if (!processing.visible) {
    return null;
  }

  const isDownloadingSpeechModel = processing.phase === 'downloading';
  const measuredDownloadProgress =
    isDownloadingSpeechModel && typeof processing.progress === 'number'
      ? Math.round(Math.max(0, Math.min(100, processing.progress)))
      : null;

  const localizedLabel =
    processing.label === 'Extracting audio...'
      ? t('processingExtractingAudio')
      : processing.label === 'Detecting spoken language...'
      ? t('processingDetectingLanguage')
      : processing.label === 'Transcribing with the selected language...'
      ? t('processingSelectedLanguage')
      : processing.label === 'Transcribing with the best on-device language...'
      ? t('processingBestLanguage')
      : processing.label === 'Downloading speech model...'
      ? t('processingDownloadingModel')
      : processing.label === 'Generating timeline...'
      ? t('processingGeneratingTimeline')
      : processing.label;

  return (
    <View pointerEvents="auto" style={styles.root}>
      <AtmosphereCanvas intensity={1.24} />
      <View style={styles.backdrop} />

      <GlassPanel style={styles.panel}>
        <Animated.View style={[styles.ring, ringStyle]}>
          <View style={styles.ringInner}>
            <Feather color={palette.cyan} name={icons[iconIndex]} size={34} />
          </View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>{t('processingOfflineAi')}</Text>
          <Text style={styles.label}>{localizedLabel}</Text>
          <Text style={styles.body}>{t('processingBody')}</Text>
        </View>

        {isDownloadingSpeechModel ? (
          <View style={styles.downloadProgressSection}>
            <View
              accessibilityLabel={localizedLabel}
              accessibilityRole="progressbar"
              accessibilityValue={
                measuredDownloadProgress === null
                  ? { min: 0, max: 100, text: localizedLabel }
                  : { min: 0, max: 100, now: measuredDownloadProgress }
              }
              style={styles.downloadProgressTrack}
              testID={PROCESSING_DOWNLOAD_PROGRESS_ID}
            >
              <View
                style={[
                  styles.downloadProgressFill,
                  measuredDownloadProgress === null
                    ? styles.downloadProgressIndeterminate
                    : { width: `${measuredDownloadProgress}%` },
                ]}
              />
            </View>

            {measuredDownloadProgress === null ? (
              <ActivityIndicator color={palette.cyan} size="small" />
            ) : (
              <Text
                style={styles.downloadProgressPercent}
                testID={PROCESSING_DOWNLOAD_PERCENT_ID}
              >
                {measuredDownloadProgress}%
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator color={palette.cyan} />
        )}
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  panel: {
    width: '84%',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 18,
  },
  ring: {
    width: 144,
    height: 144,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  ringInner: {
    width: 106,
    height: 106,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 17, 22, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  downloadProgressSection: {
    width: '100%',
    maxWidth: 300,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  downloadProgressTrack: {
    width: '100%',
    height: 9,
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.09)',
  },
  downloadProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.cyan,
  },
  downloadProgressIndeterminate: {
    width: '32%',
    opacity: 0.72,
  },
  downloadProgressPercent: {
    color: palette.cyan,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
