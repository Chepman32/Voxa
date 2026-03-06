import React, { useEffect } from 'react';
import {
  Pressable,
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

import type { PermissionSummary } from '../../types/models';
import { palette } from '../../theme/tokens';
import { GlassPanel } from '../common/GlassPanel';

interface SpeechAccessSheetProps {
  visible: boolean;
  pending: boolean;
  assetName?: string;
  speechStatus: PermissionSummary['speech'] | null;
  onClose: () => void;
  onContinueManually: () => void;
  onGrantAccess: () => void;
  onOpenSettings: () => void;
}

export function SpeechAccessSheet({
  visible,
  pending,
  assetName,
  speechStatus,
  onClose,
  onContinueManually,
  onGrantAccess,
  onOpenSettings,
}: SpeechAccessSheetProps) {
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

  const shouldOpenSettings =
    speechStatus === 'denied' || speechStatus === 'restricted';
  const title = shouldOpenSettings
    ? 'Enable Speech Access'
    : 'Grant Speech Access';
  const body = shouldOpenSettings
    ? 'Speech Recognition is turned off for Voxa. Open Settings to enable it, then return to continue generating subtitles for this video.'
    : 'Voxa needs Speech Recognition permission to generate subtitles directly on your device after you import a video.';
  const primaryLabel = shouldOpenSettings ? 'Open Settings' : 'Grant Speech Access';

  return (
    <View pointerEvents="auto" style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]} />

      <Animated.View
        style={[
          styles.sheetWrap,
          { paddingBottom: Math.max(insets.bottom, 12) },
          sheetStyle,
        ]}>
        <GlassPanel style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Feather color={palette.amber} name="mic-off" size={18} />
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather color={palette.textSecondary} name="x" size={18} />
            </Pressable>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            {assetName ? (
              <Text numberOfLines={2} style={styles.assetName}>
                {assetName}
              </Text>
            ) : null}
          </View>

          <Pressable
            disabled={pending}
            onPress={shouldOpenSettings ? onOpenSettings : onGrantAccess}
            style={[
              styles.primaryButton,
              pending ? styles.buttonDisabled : undefined,
            ]}>
            <Text style={styles.primaryButtonText}>
              {pending ? 'Checking Access...' : primaryLabel}
            </Text>
          </Pressable>

          <Pressable
            disabled={pending}
            onPress={onContinueManually}
            style={[
              styles.secondaryButton,
              pending ? styles.buttonDisabled : undefined,
            ]}>
            <Text style={styles.secondaryButtonText}>Continue Manually</Text>
          </Pressable>
        </GlassPanel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 18,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  sheetWrap: {
    paddingHorizontal: 12,
  },
  sheet: {
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 179, 64, 0.14)',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  copy: {
    gap: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  assetName: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 52,
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
  secondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
