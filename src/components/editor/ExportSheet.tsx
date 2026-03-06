import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';

import {
  applySubtitleCasing,
  findActiveSubtitle,
  isPlaceholderSubtitle,
} from '../../lib/project';
import { haptics } from '../../services/haptics';
import { exportResolutions, palette, springConfig } from '../../theme/tokens';
import type { ExportResolution, Project, SubtitleStyle } from '../../types/models';
import { GlassPanel } from '../common/GlassPanel';

interface ExportSheetProps {
  visible: boolean;
  project: Project;
  stylePreset: SubtitleStyle;
  resolution: ExportResolution;
  onClose: () => void;
  onChangeResolution: (resolution: ExportResolution) => void;
  onExport: () => Promise<void>;
}

export function ExportSheet({
  visible,
  project,
  stylePreset,
  resolution,
  onClose,
  onChangeResolution,
  onExport,
}: ExportSheetProps) {
  const insets = useSafeAreaInsets();
  const [previewTime, setPreviewTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Press and hold to export');
  const [working, setWorking] = useState(false);

  const sheetProgress = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const holdProgress = useSharedValue(0);

  useEffect(() => {
    sheetProgress.value = withTiming(visible ? 1 : 0, { duration: 260 });
    if (!visible) {
      dragOffset.value = 0;
      holdProgress.value = 0;
      setStatusMessage('Press and hold to export');
      setWorking(false);
    }
  }, [dragOffset, holdProgress, sheetProgress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: sheetProgress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          interpolate(sheetProgress.value, [0, 1], [660, 0]) + dragOffset.value,
      },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(holdProgress.value, [0, 1], [72, 0]) }],
  }));

  const closeSheet = () => {
    onClose();
  };

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      dragOffset.value = Math.max(0, event.translationY);
    })
    .onEnd(event => {
      if (event.translationY > 120) {
        runOnJS(closeSheet)();
        return;
      }
      dragOffset.value = withSpring(0, springConfig);
    });

  const handleExport = async () => {
    if (working) {
      return;
    }
    setWorking(true);
    setStatusMessage('Exporting to Photos...');

    try {
      await onExport();
      haptics.heavy();
      setStatusMessage('Saved to Photos');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Export failed. Please try again.';
      setStatusMessage(message);
    } finally {
      setWorking(false);
      holdProgress.value = withTiming(0, { duration: 220 });
    }
  };

  const handleHoldStart = () => {
    if (working) {
      return;
    }
    holdProgress.value = withTiming(1, { duration: 1500 }, finished => {
      if (finished) {
        runOnJS(handleExport)();
      }
    });
  };

  const handleHoldEnd = () => {
    if (working) {
      return;
    }
    cancelAnimation(holdProgress);
    holdProgress.value = withTiming(0, { duration: 180 });
  };

  if (!visible) {
    return null;
  }

  const activeSubtitleCandidate =
    findActiveSubtitle(project.subtitles, previewTime) ?? project.subtitles[0] ?? null;
  const activeSubtitle = isPlaceholderSubtitle(activeSubtitleCandidate)
    ? null
    : activeSubtitleCandidate;

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheetWrap,
            { paddingBottom: Math.max(insets.bottom, 12) },
            sheetStyle,
          ]}>
          <GlassPanel style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Export</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather color={palette.textSecondary} name="x" size={18} />
              </Pressable>
            </View>

            <View style={styles.preview}>
              <Video
                muted
                onProgress={event => setPreviewTime(event.currentTime * 1000)}
                paused={!visible}
                repeat
                resizeMode="cover"
                source={{ uri: project.videoLocalURI }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.previewShade} />
              {activeSubtitle ? (
                <View
                  style={[
                    styles.previewSubtitleWrap,
                    stylePreset.position === 'top'
                      ? styles.previewTop
                      : stylePreset.position === 'middle'
                      ? styles.previewMiddle
                      : styles.previewBottom,
                  ]}>
                  <Text
                    style={[
                      styles.previewSubtitleText,
                      {
                        color: stylePreset.textColor,
                        backgroundColor: stylePreset.backgroundColor,
                        fontFamily: stylePreset.fontFamily,
                        fontWeight: stylePreset.fontWeight,
                        letterSpacing: stylePreset.letterSpacing,
                        fontSize: stylePreset.fontSize * 0.55,
                      },
                    ]}>
                    {applySubtitleCasing(activeSubtitle.text, stylePreset)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Resolution</Text>
              <View style={styles.resolutionRow}>
                {exportResolutions.map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() => onChangeResolution(option.value)}
                    style={[
                      styles.resolutionPill,
                      resolution === option.value ? styles.resolutionPillActive : undefined,
                    ]}>
                    <Text
                      style={[
                        styles.resolutionText,
                        resolution === option.value ? styles.resolutionTextActive : undefined,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPressIn={handleHoldStart}
              onPressOut={handleHoldEnd}
              style={styles.holdButton}>
              <Animated.View style={[styles.holdFill, fillStyle]} />
              <View style={styles.holdContent}>
                <Feather color={palette.textPrimary} name="download" size={18} />
                <Text style={styles.holdTitle}>Export to Photos</Text>
                <Text style={styles.holdSubtitle}>{statusMessage}</Text>
              </View>
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
    zIndex: 16,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheetWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
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
    fontSize: 24,
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
  preview: {
    height: 236,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#101216',
  },
  previewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  previewSubtitleWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
  },
  previewTop: {
    top: 18,
  },
  previewMiddle: {
    top: '42%',
  },
  previewBottom: {
    bottom: 18,
  },
  previewSubtitleText: {
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  resolutionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resolutionPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  resolutionPillActive: {
    borderColor: 'rgba(0, 240, 255, 0.3)',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  resolutionText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  resolutionTextActive: {
    color: palette.textPrimary,
  },
  holdButton: {
    height: 144,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
  },
  holdFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 240, 255, 0.24)',
  },
  holdContent: {
    alignItems: 'center',
    gap: 8,
  },
  holdTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  holdSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
